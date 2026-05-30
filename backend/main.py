import asyncio
import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from dependency_scanner import check_osv_api, scan_dependencies as scan_dependency_file
    from scanner import scan_code
except ImportError:
    from .dependency_scanner import check_osv_api, scan_dependencies as scan_dependency_file
    from .scanner import scan_code

load_dotenv()

app = FastAPI(title="VibeGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://vibe-guard-phi.vercel.app",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    code: str
    language: str
    filename: str


class DependencyScanRequest(BaseModel):
    file_content: str
    filename: str


@app.get("/health")
async def health():
    osv_status = await asyncio.to_thread(check_osv_api)
    return {
        "status": "ok" if osv_status["reachable"] else "degraded",
        "osv_api": osv_status,
    }


@app.post("/scan")
async def scan(request: ScanRequest):
    result = await scan_code(request.code, request.language, request.filename)
    return result


@app.post("/scan-dependencies")
async def scan_dependencies(request: DependencyScanRequest):
    try:
        result = await asyncio.to_thread(scan_dependency_file, request.file_content, request.filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return result


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
