/**
 * GitHub Service — Placeholder
 *
 * Simulates creating a Pull Request and auto-merging it.
 * Replace with real Octokit calls when ready.
 */

let prCounter = 100; // mock PR number counter

/**
 * Simulate creating a Pull Request on GitHub.
 *
 * @param  {Object} issueData - { issueTitle, issueDescription, severity }
 * @return {Promise<Object>}  - Mock PR object
 */
async function createPR(issueData) {
    await delay(200);

    prCounter += 1;

    const pr = {
        number: prCounter,
        title: `[Self-Heal] Fix: ${issueData.issueTitle}`,
        html_url: `https://github.com/${process.env.GITHUB_OWNER || 'owner'}/${process.env.GITHUB_REPO || 'repo'}/pull/${prCounter}`,
        branch: `self-heal/${Date.now()}-fix`,
        state: 'open',
    };

    console.log(`🔀  [GitHub] PR #${pr.number} created → ${pr.html_url}`);
    return pr;
}

/**
 * Simulate auto-merging a Pull Request.
 *
 * @param  {Object} pr - The PR object returned by createPR()
 * @return {Promise<Object>}
 */
async function autoMergePR(pr) {
    await delay(200);

    console.log(`✅  [GitHub] PR #${pr.number} auto-merged successfully.`);
    return { merged: true, prNumber: pr.number };
}

// ── Helpers ──────────────────────────────────────────────
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { createPR, autoMergePR };
