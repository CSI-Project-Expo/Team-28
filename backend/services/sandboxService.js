/**
 * Sandbox Service — Placeholder
 *
 * Simulates spinning up an e2b sandbox, cloning a repo, and
 * running an AI coding agent to generate a fix.
 * Replace with real e2b SDK calls when ready.
 */

/**
 * Simulate running a sandboxed fix for the given issue.
 *
 * @param  {Object} issueData - { issueTitle, issueDescription, stepsToReproduce, severity }
 * @return {Promise<Object>}  - { sandboxId, status, summary }
 */
async function runSandbox(issueData) {
    await delay(300);

    const result = {
        sandboxId: `sbx_${Date.now()}`,
        status: 'completed',
        summary: `Sandbox fix generated for: "${issueData.issueTitle}"`,
    };

    console.log(`📦  [Sandbox] ${result.sandboxId} — ${result.status}`);
    return result;
}

// ── Helpers ──────────────────────────────────────────────
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { runSandbox };
