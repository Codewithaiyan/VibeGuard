# VibeGuard 🛡️

**Ship safe. Every time.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-vibe--guard--phi.vercel.app-000000?logo=vercel&logoColor=white)](https://vibe-guard-phi.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=white)](https://vibeguard-backend.onrender.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?logo=react&logoColor=white)](https://vibe-guard-phi.vercel.app)
[![AI](https://img.shields.io/badge/AI-GPT--4o--mini-10A37F?logo=openai&logoColor=white)](https://platform.openai.com/)
[![License](https://img.shields.io/badge/License-MIT-F7DF1E)](https://github.com/Codewithaiyan/VibeGuard)

## 🌐 Live Demo

**App:** [https://vibe-guard-phi.vercel.app](https://vibe-guard-phi.vercel.app)  
**Backend:** [https://vibeguard-backend.onrender.com](https://vibeguard-backend.onrender.com)  
**GitHub:** [https://github.com/Codewithaiyan/VibeGuard](https://github.com/Codewithaiyan/VibeGuard)

VibeGuard is an automated AI-powered security scanner for AI-generated code. It scans every pull request, generates a Trust Score and vulnerability report for each changed file, posts the results as a PR comment, and blocks merges when any file scores below 50.

## ✨ Features

- 🤖 AI-powered security analysis using OpenAI GPT-4o-mini
- 📊 Trust Score from 0 to 100 for every file scanned
- 🔍 Detects hardcoded secrets, SQL injection, XSS, command injection, broken authentication, missing input validation, and exposed API keys
- 🔄 Automated pull request scanning through GitHub Actions
- 💬 Posts a full vulnerability report directly on the PR
- 🚫 Fails the PR check if any scanned file scores below 50
- 🌙 Dark-themed React interface for manual scanning and demo use
- 🚀 Live demo deployed on Vercel with backend hosted on Render

## ⚙️ How It Works

1. A pull request is opened, reopened, or updated.
2. GitHub Actions finds all changed `.py`, `.js`, `.ts`, `.jsx`, and `.tsx` files.
3. Each changed file is sent to the deployed FastAPI backend on Render.
4. The backend uses GPT-4o-mini to evaluate the code and return a Trust Score, risk level, summary, and vulnerability list.
5. The workflow posts the scan results as a pull request comment.
6. If any file scores below 50, the workflow fails. With branch protection enabled, the merge is blocked.

## 🏗️ Tech Stack

- **Frontend:** React + Vite, deployed on Vercel
- **Backend:** FastAPI + Python 3.12, deployed on Render
- **AI:** OpenAI GPT-4o-mini
- **Automation:** GitHub Actions
- **Version Control:** GitHub with branch protection

## 💻 Local Development

### Prerequisites

- Python 3.12+
- Node.js 24+
- OpenAI API key

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your OPENAI_API_KEY to .env
```

### Frontend Setup

```bash
cd frontend
npm install
printf "VITE_API_URL=http://localhost:8000\n" > .env
```

The frontend reads `VITE_API_URL` and falls back to `http://localhost:8000` if the variable is not set.

### Running Locally

**Terminal 1 - Backend**

```bash
cd backend && source venv/bin/activate
uvicorn main:app --reload
```

Runs at `http://localhost:8000`

**Terminal 2 - Frontend**

```bash
cd frontend
npm run dev
```

Runs at `http://localhost:5173`

## 🤖 GitHub Actions Setup

1. Add `OPENAI_API_KEY` as a GitHub Actions secret.
2. The workflow triggers automatically on every pull request.
3. It scans all changed `.py`, `.js`, `.ts`, `.jsx`, and `.tsx` files.
4. It posts Trust Scores, risk levels, and a detailed vulnerability report as a PR comment.
5. It fails the check if any scanned file scores below 50.
6. Enable branch protection so the failing check blocks merges.

The workflow lives in [`.github/workflows/vibeguard.yml`](.github/workflows/vibeguard.yml) and is already configured to call the deployed Render backend.

## 🧪 Demo Files

- `demo/vulnerable_code.py` contains 5 intentional vulnerabilities for testing.
- `demo/safe_code.py` contains a safer version for comparison.

## 📁 Project Structure

```text
VibeGuard/
├── backend/
│   ├── main.py
│   ├── scanner.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Landing.jsx
│   │   ├── Landing.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── demo/
│   ├── vulnerable_code.py
│   └── safe_code.py
├── .github/
│   └── workflows/
│       └── vibeguard.yml
├── QUICKSTART.md
└── README.md
```

## 🏁 Hackathon

Built for the **OpenAI x Outskill AI Builders Hackathon**.

## 📄 License

MIT
