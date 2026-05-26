import json
import os
from datetime import datetime
from openai import OpenAI

async def scan_code(code: str, language: str, filename: str) -> dict:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    prompt = f"""You are a security expert analyzing code for vulnerabilities.

Analyze this {language} code from file "{filename}" for security issues:
- Hardcoded secrets (passwords, API keys, tokens)
- SQL injection vulnerabilities
- XSS (Cross-Site Scripting)
- Broken authentication
- Exposed API keys
- Missing input validation
- Insecure dependencies
- Command injection

Code:
```{language}
{code}
```

Return ONLY valid JSON (no markdown, no extra text) with this exact structure:
{{
  "trust_score": <number 0-100, where 100 is perfectly safe>,
  "risk_level": "<CRITICAL|HIGH|MEDIUM|LOW|SAFE>",
  "vulnerabilities": [
    {{
      "line_number": <number>,
      "severity": "<CRITICAL|HIGH|MEDIUM|LOW>",
      "title": "<short title>",
      "description": "<what the issue is>",
      "fix": "<how to fix it>"
    }}
  ],
  "summary": "<one paragraph plain English summary of security posture>"
}}"""

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        response_text = response.choices[0].message.content.strip()
        
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        parsed = json.loads(response_text)
        parsed["scanned_at"] = datetime.utcnow().isoformat() + "Z"
        return parsed
        
    except json.JSONDecodeError:
        return {
            "trust_score": 50,
            "risk_level": "MEDIUM",
            "vulnerabilities": [{
                "line_number": 0,
                "severity": "MEDIUM",
                "title": "Analysis Error",
                "description": "Could not parse security analysis results",
                "fix": "Manual review recommended"
            }],
            "summary": "Automated analysis encountered parsing issues. Manual security review recommended.",
            "scanned_at": datetime.utcnow().isoformat() + "Z"
        }
    except Exception as e:
        return {
            "trust_score": 0,
            "risk_level": "CRITICAL",
            "vulnerabilities": [{
                "line_number": 0,
                "severity": "CRITICAL",
                "title": "Scan Failed",
                "description": f"Error during security scan: {str(e)}",
                "fix": "Check OpenAI API key and try again"
            }],
            "summary": f"Security scan failed: {str(e)}",
            "scanned_at": datetime.utcnow().isoformat() + "Z"
        }
