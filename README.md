# 🩺 Site Surgeon – AI Self-Healing Web System

A full-stack prototype that **automatically receives bug reports, classifies them with AI, spins up a sandboxed environment, attempts a code fix, and opens a GitHub Pull Request** – all with zero human involvement for simple bugs.

---

## Architecture Overview

```
Browser (React + Vite)
        │  POST /api/issues/report
        ▼
Express Backend (TypeScript)
        │
        ├── AI Classifier (Claude)         → AUTOMATED or MANUAL
        │         │
        │    AUTOMATED                 MANUAL
        │         │                      │
        ├── E2B Sandbox              Email Admin
        │    ├── git clone
        │    ├── npm install
        │    ├── AI Coding Agent (Claude)
        │    │    ├── identify relevant files
        │    │    ├── read files
        │    │    ├── generate patch
        │    │    └── write fixed files
        │    └── run tests / build
        │
        └── GitHub API
             ├── create branch
             ├── commit files
             ├── open PR
             └── auto-merge (if AUTOMATED)
                      │
               Email Summary → Admin
```

---

## Tech Stack

| Layer       | Technology                              |
|-------------|------------------------------------------|
| Frontend    | React 18, Vite 5, Tailwind CSS, Axios    |
| Backend     | Node.js, Express, TypeScript             |
| AI          | Anthropic Claude 3.5 Sonnet              |
| Sandbox     | E2B Code Interpreter (cloud microVMs)    |
| Version Ctrl| GitHub REST API via Octokit              |
| Email       | Nodemailer (SMTP)                        |
| Logging     | Winston                                  |

---

## Project Structure

```
site/
├── backend/
│   ├── src/
│   │   ├── agents/
│   │   │   └── codingAgent.ts        # Claude-powered code fixer
│   │   ├── controllers/
│   │   │   ├── issueController.ts    # HTTP handler for issue routes
│   │   │   └── dashboardController.ts
│   │   ├── routes/
│   │   │   ├── issueRoutes.ts        # POST /report, GET /:id
│   │   │   └── dashboardRoutes.ts    # GET /issues, GET /stats
│   │   ├── sandbox/
│   │   │   └── sandboxManager.ts     # E2B sandbox lifecycle
│   │   ├── services/
│   │   │   ├── aiClassifier.ts       # Claude classification
│   │   │   ├── emailService.ts       # Nodemailer SMTP
│   │   │   ├── githubService.ts      # Octokit PRs
│   │   │   └── issueProcessor.ts     # Main orchestration pipeline
│   │   ├── utils/
│   │   │   ├── logger.ts             # Winston logger
│   │   │   ├── store.ts              # In-memory issue store
│   │   │   └── types.ts              # Shared TypeScript types
│   │   └── server.ts                 # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts             # Axios + API call functions
│   │   ├── components/
│   │   │   ├── LogViewer.tsx         # Sandbox log display
│   │   │   ├── SeverityBadge.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── hooks/
│   │   │   ├── useDashboard.ts       # Auto-refreshing dashboard data
│   │   │   └── useIssue.ts           # Polling issue status
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx     # Issue table + stats
│   │   │   ├── IssueDetailPage.tsx   # Live status + logs
│   │   │   └── ReportPage.tsx        # Bug report form
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
└── README.md
```

---

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Anthropic API key → https://console.anthropic.com/
- E2B API key → https://e2b.dev/
- GitHub Personal Access Token (scopes: `repo`, `pull_requests`)
- SMTP credentials (Gmail App Password recommended)

---

## Setup & Local Development

### 1. Clone / download this project

```bash
cd site
```

### 2. Backend setup

```bash
cd backend

# Install dependencies
npm install

# Copy env template and fill in your keys
cp .env.example .env
nano .env   # or use your editor
```

Required `.env` values:

| Variable                | Where to get it                                        |
|------------------------|--------------------------------------------------------|
| `ANTHROPIC_API_KEY`    | https://console.anthropic.com/settings/keys            |
| `E2B_API_KEY`          | https://e2b.dev/ → Dashboard → API Keys               |
| `GITHUB_TOKEN`         | https://github.com/settings/tokens/new (repo scope)   |
| `GITHUB_OWNER`         | Your GitHub username or org                            |
| `GITHUB_REPO`          | Default repo name (fallback)                           |
| `GITHUB_DEFAULT_BRANCH`| `main` or `master`                                     |
| `SMTP_HOST`            | e.g. `smtp.gmail.com`                                  |
| `SMTP_PORT`            | `587` for TLS, `465` for SSL                           |
| `SMTP_USER`            | Your email address                                     |
| `SMTP_PASS`            | Gmail App Password (not your login password)           |
| `NOTIFICATION_EMAIL`   | Admin email to receive notifications                   |

```bash
# Create logs directory
mkdir -p logs

# Start in development mode (hot reload)
npm run dev
```

The backend starts on **http://localhost:4000**.

### 3. Frontend setup

Open a second terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy env template (optional – Vite proxy handles /api)
cp .env.example .env

# Start dev server
npm run dev
```

The frontend starts on **http://localhost:5173**.

---

## API Reference

### POST `/api/issues/report`

Submit a bug report and start the AI pipeline.

**Body:**
```json
{
  "title": "Login fails on mobile Safari",
  "description": "Clicking Sign In throws a 500...",
  "stepsToReproduce": "1. Go to /login\n2. ...",
  "severity": "high",
  "repoUrl": "https://github.com/owner/repo"
}
```

**Response `201`:**
```json
{ "message": "Issue received.", "issueId": "uuid", "status": "received" }
```

---

### GET `/api/issues/:id`

Poll for the current status of an issue.

**Response:**
```json
{
  "id": "...",
  "status": "merged",
  "aiDecision": "AUTOMATED",
  "aiReason": "Simple null check bug...",
  "prUrl": "https://github.com/owner/repo/pull/42",
  "sandboxLogs": ["Step 1: ...", "..."],
  ...
}
```

---

### GET `/api/dashboard/issues`

List all issues (newest first).

### GET `/api/dashboard/stats`

Summary counts by status and AI decision.

---

## Example Test Flow

1. Start both backend and frontend.
2. Open **http://localhost:5173**.
3. Fill in the report form:
   - **Title**: `Null pointer in user profile loading`
   - **Description**: `When a user has no avatar set, calling user.avatar.url throws TypeError: Cannot read properties of null`
   - **Steps**: `1. Create user without avatar\n2. Visit /profile\n3. See crash`
   - **Severity**: `Medium`
   - **Repo URL**: `https://github.com/your-org/your-repo`
4. Click **Submit Report**.
5. You'll be redirected to the Issue Detail page. Watch the progress stepper advance in real time.
6. Check your GitHub repo for the new branch and PR.
7. Check your email for the notification.

---

## AI Prompt Examples

### Classifier Prompt (used in `aiClassifier.ts`)

```
Bug Report:
- Title: Null pointer in user profile loading
- Severity: medium
- Description: When a user has no avatar set...
- Steps to Reproduce: 1. Create user without avatar...
- Repository: https://github.com/owner/repo

Please classify this bug report.
```

Claude responds:
```json
{
  "decision": "AUTOMATED",
  "reason": "This is a straightforward null-check bug with a clear reproduction path. An AI agent can add a safe navigation operator or null guard without risk.",
  "confidence": 92
}
```

---

### Coding Agent File Scout Prompt (used in `codingAgent.ts`)

```
Bug Title: Null pointer in user profile loading
Description: ...

Repository files:
src/controllers/userController.ts
src/models/User.ts
src/routes/userRoutes.ts
...
```

Claude responds:
```json
{ "files": ["src/controllers/userController.ts", "src/models/User.ts"] }
```

---

### Coding Agent Fix Prompt

Claude receives the full file contents and responds:
```json
{
  "commitMessage": "fix: add null guard for user avatar in profile controller",
  "patchSummary": "Added optional chaining (?.) when accessing user.avatar.url to prevent TypeError when avatar is null.",
  "files": [
    {
      "path": "src/controllers/userController.ts",
      "content": "... full fixed file content ..."
    }
  ]
}
```

---

## Security Notes

- All inputs are validated with `express-validator` before processing.
- Rate limiting: 60 requests/minute/IP globally.
- GitHub URLs are validated by regex before sandbox clone.
- The AI never executes arbitrary user-provided code – it only modifies files inside an isolated E2B microVM.
- For production: replace the in-memory `issueStore` with a real database (Postgres/MongoDB) and add authentication.

---

## Production Considerations

| Concern | Recommendation |
|---|---|
| Persistence | Replace `utils/store.ts` with PostgreSQL + Prisma |
| Auth | Add JWT or OAuth2 to API and dashboard |
| Queue | Use BullMQ/Redis instead of bare async calls |
| Secrets | Use a secrets manager (Vault, AWS Secrets Manager) |
| E2B timeout | Increase sandbox `timeoutMs` for large repos |
| PR merge policy | Require CI green checks before auto-merge |

---

## License

MIT
