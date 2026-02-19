# AI Self-Healing System

This project implements an autonomous AI-driven system for detecting, fixing, and managing software issues. It leverages AI analysis and sandboxed environments to streamline the debugging and patching process.

## Architecture & Workflow

The system operates in three main stages:

### 1. Issue Reporting
- **Endpoint**: `/report`
- **Interface**: A web-based form where users can submit details about an issue they are experiencing.
- **Action**: User fills in the issue details and clicks "Send".

### 2. AI Triage & Analysis
- **Process**: The reported issue is sent to an AI agent.
- **Decision**: The AI analyzes the report and categorizes the resolution path as either:
    - **AUTOMATED**: The AI is confident the issue can be safely fixed and merged automatically.
    - **MANUAL**: The issue requires human oversight (e.g., complex logic, ambiguity, or high risk).

### 3. Execution & Remediation
Regardless of the triage decision (Automated or Manual), the system proceeds to generate a fix:

1.  **Sandbox Creation**: A secure sandbox environment is initialized using **e2b.dev**.
2.  **Tooling**: **Claude Code** (or similar AI coding tool) is initialized within the sandbox.
3.  **Repository Setup**: The target repository is cloned into the sandbox.
4.  **Fix Generation**:
    - Claude Code attempts to reproduce the issue using the user-provided data.
    - It iterates on coding, fixing, and testing the solution.
5.  **Pull Request**: Once verified, the changes are pushed to a new branch, and a Pull Request (PR) is created.

### 4. Resolution Handling

Existing flows diverge based on the initial AI Triage decision:

- **path: AUTOMATED**
    - The system automatically approves and merges the Pull Request into the main branch.

- **path: MANUAL**
    - The Pull Request is held in an open state.
    - An email notification is sent to the admin/owner alerting them of the pending PR.
    - Human review is required to merge or reject the changes.

## Tech Stack (Planned)
- **Frontend**: react+vite
- **Sandbox Environment**: e2b.dev
- **AI Engine**: Claude / OpenAI
- **Coding Agent**: Claude Code
- **Backend**: nodejs+express

