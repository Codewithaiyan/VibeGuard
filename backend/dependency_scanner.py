import json
import re
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib import error, request

OSV_QUERY_URL = "https://api.osv.dev/v1/query"
OSV_TIMEOUT_SECONDS = 10
OSV_HEALTH_TIMEOUT_SECONDS = 5
OSV_HEALTH_CACHE_TTL_SECONDS = 300
OSV_HEALTH_SAMPLE = {
    "package": {"name": "jinja2", "ecosystem": "PyPI"},
    "version": "3.1.4",
}
SUPPORTED_FILES = {"requirements.txt", "package.json", "go.mod"}
SEVERITY_ORDER = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}
SEVERITY_ALIASES = {
    "MODERATE": "MEDIUM",
    "IMPORTANT": "HIGH",
    "UNKNOWN": "MEDIUM",
    "INFO": "LOW",
    "NONE": "LOW",
}

_health_cache = {
    "checked_at": 0.0,
    "reachable": False,
    "message": "OSV API has not been checked yet.",
    "checked_at_iso": None,
}
_health_cache_lock = threading.Lock()


class OSVUnavailableError(RuntimeError):
    pass


class OSVQueryError(RuntimeError):
    pass


@dataclass(frozen=True)
class DependencySpec:
    name: str
    version: Optional[str]
    ecosystem: str


def _utc_timestamp() -> str:
    return datetime.utcnow().isoformat() + "Z"


def _normalize_severity(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    normalized = value.strip().upper()
    normalized = SEVERITY_ALIASES.get(normalized, normalized)
    if normalized in SEVERITY_ORDER:
        return normalized
    return None


def _severity_from_score(score: Any) -> Optional[str]:
    if isinstance(score, (int, float)):
        value = float(score)
    elif isinstance(score, str):
        match = re.match(r"^\s*(\d+(?:\.\d+)?)", score)
        if not match:
            return None
        value = float(match.group(1))
    else:
        return None

    if value >= 9.0:
        return "CRITICAL"
    if value >= 7.0:
        return "HIGH"
    if value >= 4.0:
        return "MEDIUM"
    return "LOW"


def _normalize_version(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    cleaned = value.strip().strip("\"'")
    if not cleaned:
        return None

    cleaned = re.split(r"\s*\|\||\s+", cleaned, maxsplit=1)[0]
    cleaned = re.sub(r"^[=<>!~^\s]+", "", cleaned)
    cleaned = cleaned.rstrip(",")
    if not cleaned or cleaned in {"*", "latest"}:
        return None
    if ":" in cleaned and not cleaned.startswith("v"):
        return None
    return cleaned


def _deduplicate_dependencies(dependencies: List[DependencySpec]) -> List[DependencySpec]:
    seen = set()
    unique_dependencies = []
    for dependency in dependencies:
        key = (dependency.name.lower(), dependency.version or "", dependency.ecosystem)
        if key in seen:
            continue
        seen.add(key)
        unique_dependencies.append(dependency)

    return sorted(unique_dependencies, key=lambda item: (item.name.lower(), item.version or ""))


def _parse_requirements(content: str) -> List[DependencySpec]:
    dependencies = []
    requirement_pattern = re.compile(
        r"^([A-Za-z0-9_.-]+(?:\[[A-Za-z0-9_,.-]+\])?)\s*(===|==|~=|>=|<=|!=|>|<)?\s*([^;\s]+)?"
    )

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or line.startswith("-"):
            continue

        line = line.split("#", 1)[0].strip()
        if not line:
            continue

        match = requirement_pattern.match(line)
        if not match:
            continue

        package_name = match.group(1).split("[", 1)[0]
        version = _normalize_version(match.group(3))
        dependencies.append(DependencySpec(package_name, version, "PyPI"))

    return dependencies


def _parse_package_json(content: str) -> List[DependencySpec]:
    try:
        manifest = json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid package.json: {str(exc)}") from exc

    dependencies = []
    for section in ("dependencies", "devDependencies"):
        section_data = manifest.get(section, {})
        if not isinstance(section_data, dict):
            continue

        for package_name, raw_version in section_data.items():
            version = _normalize_version(raw_version if isinstance(raw_version, str) else None)
            dependencies.append(DependencySpec(package_name, version, "npm"))

    return dependencies


def _parse_go_mod(content: str) -> List[DependencySpec]:
    dependencies = []
    in_require_block = False

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("//"):
            continue

        line = line.split("//", 1)[0].strip()
        if not line:
            continue

        if line == "require (":
            in_require_block = True
            continue

        if in_require_block and line == ")":
            in_require_block = False
            continue

        if line.startswith(("module ", "go ", "toolchain ", "replace ", "exclude ", "retract ")):
            continue

        dependency_line = line
        if line.startswith("require "):
            dependency_line = line[len("require "):].strip()
        elif not in_require_block:
            continue

        parts = dependency_line.split()
        if len(parts) < 2:
            continue

        dependencies.append(DependencySpec(parts[0], _normalize_version(parts[1]), "Go"))

    return dependencies


def _detect_file_type(filename: str) -> str:
    basename = Path(filename).name.lower()
    if basename not in SUPPORTED_FILES:
        supported = ", ".join(sorted(SUPPORTED_FILES))
        raise ValueError(f'Unsupported dependency file "{filename}". Supported files: {supported}.')
    return basename


def _post_osv_query(payload: Dict[str, Any], timeout: int = OSV_TIMEOUT_SECONDS) -> Dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    http_request = request.Request(
        OSV_QUERY_URL,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "User-Agent": "VibeGuard/1.0",
        },
    )

    try:
        with request.urlopen(http_request, timeout=timeout) as response:
            raw_response = response.read().decode("utf-8")
    except error.HTTPError as exc:
        details = exc.read().decode("utf-8", errors="replace").strip()
        message = details or f"HTTP {exc.code}"
        raise OSVQueryError(message) from exc
    except (error.URLError, TimeoutError, OSError) as exc:
        raise OSVUnavailableError(str(exc)) from exc

    try:
        return json.loads(raw_response)
    except json.JSONDecodeError as exc:
        raise OSVQueryError("OSV API returned invalid JSON") from exc


def _query_osv_vulnerabilities(dependency: DependencySpec) -> List[Dict[str, Any]]:
    if not dependency.version:
        return []

    payload = {
        "version": dependency.version,
        "package": {
            "name": dependency.name,
            "ecosystem": dependency.ecosystem,
        },
    }

    vulnerabilities: List[Dict[str, Any]] = []
    page_token: Optional[str] = None

    while True:
        current_payload = dict(payload)
        if page_token:
            current_payload["page_token"] = page_token

        response_payload = _post_osv_query(current_payload)
        vulnerabilities.extend(response_payload.get("vulns", []))
        page_token = response_payload.get("next_page_token")
        if not page_token:
            break

    return vulnerabilities


def _extract_fixed_version(vulnerability: Dict[str, Any], package_name: str) -> Optional[str]:
    fixed_versions = []
    for affected in vulnerability.get("affected", []):
        package = affected.get("package", {})
        if package.get("name") != package_name:
            continue

        for affected_range in affected.get("ranges", []):
            for event in affected_range.get("events", []):
                fixed_version = event.get("fixed")
                if fixed_version:
                    fixed_versions.append(fixed_version)

    if not fixed_versions:
        return None

    unique_versions = []
    for version in fixed_versions:
        if version not in unique_versions:
            unique_versions.append(version)
    return ", ".join(unique_versions)


def _pick_vulnerability_id(vulnerability: Dict[str, Any]) -> str:
    aliases = vulnerability.get("aliases", [])
    for prefix in ("CVE-", "GHSA-"):
        for alias in aliases:
            if isinstance(alias, str) and alias.startswith(prefix):
                return alias

    vulnerability_id = vulnerability.get("id")
    if isinstance(vulnerability_id, str) and vulnerability_id:
        return vulnerability_id

    for alias in aliases:
        if isinstance(alias, str) and alias:
            return alias

    return "UNKNOWN"


def _extract_severity(vulnerability: Dict[str, Any], package_name: str) -> str:
    for affected in vulnerability.get("affected", []):
        package = affected.get("package", {})
        if package.get("name") != package_name:
            continue

        severity = _normalize_severity((affected.get("ecosystem_specific") or {}).get("severity"))
        if severity:
            return severity

        severity = _normalize_severity((affected.get("database_specific") or {}).get("severity"))
        if severity:
            return severity

    severity = _normalize_severity((vulnerability.get("database_specific") or {}).get("severity"))
    if severity:
        return severity

    for entry in vulnerability.get("severity", []):
        severity = _severity_from_score(entry.get("score"))
        if severity:
            return severity

    return "MEDIUM"


def _normalize_description(vulnerability: Dict[str, Any], title: str) -> str:
    description = vulnerability.get("details") or vulnerability.get("summary") or title
    return re.sub(r"\s+", " ", description).strip()


def _build_vulnerability_entry(dependency: DependencySpec, vulnerability: Dict[str, Any]) -> Dict[str, Any]:
    vulnerability_id = _pick_vulnerability_id(vulnerability)
    title = (vulnerability.get("summary") or vulnerability_id or "Untitled vulnerability").strip()
    return {
        "package_name": dependency.name,
        "current_version": dependency.version or "unknown",
        "vulnerability_id": vulnerability_id,
        "severity": _extract_severity(vulnerability, dependency.name),
        "title": title,
        "description": _normalize_description(vulnerability, title),
        "fixed_version": _extract_fixed_version(vulnerability, dependency.name),
    }


def _calculate_risk_level(vulnerabilities: List[Dict[str, Any]], fully_scanned: bool) -> str:
    if vulnerabilities:
        return max(vulnerabilities, key=lambda item: SEVERITY_ORDER.get(item["severity"], 0))["severity"]
    if fully_scanned:
        return "SAFE"
    return "UNKNOWN"


def _calculate_dependency_score(total_packages: int, vulnerable_packages: int) -> int:
    if total_packages <= 0:
        return 100
    safe_packages = max(total_packages - vulnerable_packages, 0)
    return int(round((safe_packages / total_packages) * 100))


def _build_result(
    dependencies: List[DependencySpec],
    vulnerabilities: List[Dict[str, Any]],
    warnings: List[str],
    scan_status: str,
    scanned_packages: int,
) -> Dict[str, Any]:
    vulnerable_packages = len({(item["package_name"], item["current_version"]) for item in vulnerabilities})
    dependency_score = _calculate_dependency_score(len(dependencies), vulnerable_packages)
    fully_scanned = len(dependencies) == scanned_packages and scan_status == "ok"

    severity_rank = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    vulnerabilities.sort(key=lambda item: (severity_rank.get(item["severity"], 4), item["package_name"].lower(), item["vulnerability_id"]))

    return {
        "total_packages": len(dependencies),
        "scanned_packages": scanned_packages,
        "vulnerable_packages": vulnerable_packages,
        "vulnerabilities": vulnerabilities,
        "dependency_score": dependency_score,
        "risk_level": _calculate_risk_level(vulnerabilities, fully_scanned),
        "scan_status": scan_status,
        "warnings": warnings,
    }


def scan_dependencies(file_content: str, filename: str) -> Dict[str, Any]:
    file_type = _detect_file_type(filename)
    parser_map = {
        "requirements.txt": _parse_requirements,
        "package.json": _parse_package_json,
        "go.mod": _parse_go_mod,
    }

    dependencies = _deduplicate_dependencies(parser_map[file_type](file_content))
    if not dependencies:
        return {
            "total_packages": 0,
            "scanned_packages": 0,
            "vulnerable_packages": 0,
            "vulnerabilities": [],
            "dependency_score": 100,
            "risk_level": "SAFE",
            "scan_status": "ok",
            "warnings": ["No dependencies were found in the submitted file."],
        }

    warnings = []
    all_vulnerabilities: List[Dict[str, Any]] = []
    queryable_dependencies = []
    for dependency in dependencies:
        if dependency.version:
            queryable_dependencies.append(dependency)
        else:
            warnings.append(
                f"Skipped {dependency.name}: no package version was provided, so OSV could not run a version-specific check."
            )

    if not queryable_dependencies:
        return _build_result(dependencies, all_vulnerabilities, warnings, "partial", 0)

    successful_queries = 0
    unavailable_failures = 0

    with ThreadPoolExecutor(max_workers=min(8, len(queryable_dependencies))) as executor:
        future_to_dependency = {
            executor.submit(_query_osv_vulnerabilities, dependency): dependency
            for dependency in queryable_dependencies
        }
        for future in as_completed(future_to_dependency):
            dependency = future_to_dependency[future]
            try:
                vulnerabilities = future.result()
            except OSVUnavailableError as exc:
                unavailable_failures += 1
                warnings.append(
                    f"OSV API was unreachable while scanning {dependency.name}@{dependency.version}: {str(exc)}"
                )
            except OSVQueryError as exc:
                warnings.append(
                    f"Could not query OSV for {dependency.name}@{dependency.version}: {str(exc)}"
                )
            except Exception as exc:
                warnings.append(
                    f"Unexpected error while scanning {dependency.name}@{dependency.version}: {str(exc)}"
                )
            else:
                successful_queries += 1
                for vulnerability in vulnerabilities:
                    all_vulnerabilities.append(_build_vulnerability_entry(dependency, vulnerability))

    if successful_queries == 0 and unavailable_failures == len(queryable_dependencies):
        warnings.insert(0, "OSV API is unreachable. Dependency vulnerability scanning was skipped.")
        return _build_result(dependencies, all_vulnerabilities, warnings, "skipped", 0)

    if successful_queries == len(queryable_dependencies) and len(warnings) == 0:
        scan_status = "ok"
    else:
        scan_status = "partial"
        if unavailable_failures:
            warnings.insert(0, "Some dependency checks could not be completed because the OSV API was intermittently unavailable.")

    return _build_result(dependencies, all_vulnerabilities, warnings, scan_status, successful_queries)


def check_osv_api(force_refresh: bool = False) -> Dict[str, Any]:
    now = time.time()
    with _health_cache_lock:
        if not force_refresh and (now - _health_cache["checked_at"]) < OSV_HEALTH_CACHE_TTL_SECONDS:
            return {
                "reachable": _health_cache["reachable"],
                "message": _health_cache["message"],
                "checked_at": _health_cache["checked_at_iso"],
            }

    try:
        _post_osv_query(OSV_HEALTH_SAMPLE, timeout=OSV_HEALTH_TIMEOUT_SECONDS)
        health_result = {
            "reachable": True,
            "message": "OSV API reachable.",
            "checked_at": _utc_timestamp(),
        }
    except OSVUnavailableError as exc:
        health_result = {
            "reachable": False,
            "message": f"OSV API unreachable: {str(exc)}",
            "checked_at": _utc_timestamp(),
        }
    except OSVQueryError as exc:
        health_result = {
            "reachable": False,
            "message": f"OSV API health check failed: {str(exc)}",
            "checked_at": _utc_timestamp(),
        }

    with _health_cache_lock:
        _health_cache["checked_at"] = now
        _health_cache["reachable"] = health_result["reachable"]
        _health_cache["message"] = health_result["message"]
        _health_cache["checked_at_iso"] = health_result["checked_at"]

    return health_result
