# VibeGuard 🛡️

**Ship safe. Every time.**

VibeGuard is an automated AI-powered code security scanner that analyzes your code for vulnerabilities before it reaches production. Built for hackathons, designed for real-world security.

## Features

- 🤖 **AI-Powered Analysis** - Uses OpenAI GPT-4o-mini for intelligent security scanning
- 🔍 **Comprehensive Detection** - Finds hardcoded secrets, SQL injection, XSS, command injection, and more
- 📊 **Trust Score** - Get a 0-100 security score for every file
- 🎨 **Beautiful UI** - Dark-themed React interface with real-time scanning
- 🔄 **GitHub Actions Integration** - Automatic PR scanning and commenting
- ⚡ **Fast & Local** - Powered by OpenAI API for fast and accurate analysis

## Security Checks

VibeGuard scans for:
- Hardcoded secrets (passwords, API keys, tokens)
- SQL injection vulnerabilities
- Cross-Site Scripting (XSS)
- Broken authentication
- Missing input validation
- Insecure dependencies
- Command injection risks

## Setup

### Prerequisites

- Python 3.12+
- Node.js 24+
- OpenAI API key (get one at platform.openai.com)

### Environment Variables

Create a `.env` file in the backend folder:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
PORT=8000
```

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your OpenAI API key to .env file
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running Locally

### Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate
python main.py
```

Backend runs on http://localhost:8000

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Paste your code into the editor
3. Select the programming language
4. Click "Scan Code"
5. Review the trust score, risk level, and vulnerabilities

## GitHub Actions Integration

VibeGuard automatically scans all code changes in pull requests.

### How It Works

1. When a PR is opened, the workflow triggers
2. All changed `.py`, `.js`, `.ts`, `.jsx`, `.tsx` files are identified
3. Each file is scanned using the VibeGuard API
4. Results are posted as a PR comment with:
   - Trust scores for each file
   - Risk levels
   - Detailed vulnerability reports
5. The workflow fails if any file scores below 50/100

### Setup in Your Repo

1. Copy `.github/workflows/vibeguard.yml` to your repository
2. Add `OPENAI_API_KEY` as a GitHub Actions secret in your repository settings
3. Push to GitHub and open a PR to see it in action

## Demo Files

- `demo/vulnerable_code.py` - Example with 5 intentional vulnerabilities
- `demo/safe_code.py` - Secure version of the same functionality

Try scanning both to see the difference!

## Tech Stack

- **Backend**: FastAPI, Python 3.12
- **Frontend**: React, Vite
- **AI**: OpenAI GPT-4o-mini
- **CI/CD**: GitHub Actions

## Project Structure

```
VibeGuard/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── scanner.py       # Security scanning logic
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── App.jsx      # Main React component
│   │   └── App.css      # Styling
│   └── package.json
├── demo/
│   ├── vulnerable_code.py
│   └── safe_code.py
├── .github/
│   └── workflows/
│       └── vibeguard.yml
└── README.md
```

## License

MIT

## Contributing

Built for hackathons. Feel free to fork, modify, and improve!

---

**VibeGuard** - Because security shouldn't be an afterthought.
