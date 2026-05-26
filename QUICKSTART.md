# VibeGuard - Quick Start Guide

## ✅ Setup Complete!

All files have been created and dependencies installed.

## 🚀 Running Locally

### Prerequisites
Make sure Ollama is running with the qwen3.5 model:
```bash
ollama serve
ollama pull qwen3.5:latest
```

### Terminal 1 - Backend
```bash
cd ~/Desktop/VibeGuard/backend
source venv/bin/activate
python main.py
```
Backend will run on: **http://localhost:8000**

### Terminal 2 - Frontend
```bash
cd ~/Desktop/VibeGuard/frontend
npm run dev
```
Frontend will run on: **http://localhost:5173**

## 🧪 Testing

Open http://localhost:5173 in your browser and try scanning:
- `demo/vulnerable_code.py` - Should show LOW trust score with 5 vulnerabilities
- `demo/safe_code.py` - Should show HIGH trust score with minimal/no issues

## 📁 Project Structure

```
VibeGuard/
├── backend/
│   ├── main.py              ✅ Created
│   ├── scanner.py           ✅ Created
│   ├── requirements.txt     ✅ Created
│   ├── .env                 ✅ Created
│   └── venv/                ✅ Installed
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ✅ Created
│   │   └── App.css          ✅ Created
│   ├── .env                 ✅ Created
│   └── node_modules/        ✅ Installed
├── demo/
│   ├── vulnerable_code.py   ✅ Created
│   └── safe_code.py         ✅ Created
├── .github/
│   └── workflows/
│       └── vibeguard.yml    ✅ Created
├── .gitignore               ✅ Created
└── README.md                ✅ Created
```

## 🎯 Next Steps

1. Start both backend and frontend
2. Test with demo files
3. Customize the UI colors/styling in `frontend/src/App.css`
4. Add more security checks in `backend/scanner.py`
5. Deploy and demo at your hackathon!

Good luck! 🚀
