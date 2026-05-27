from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from scanner import scan_code

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

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/scan")
async def scan(request: ScanRequest):
    result = await scan_code(request.code, request.language, request.filename)
    return result

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
