/**
 * Mock AI Classification Service
 *
 * Simulates an AI model that analyses severity + issue content
 * and returns either "AUTOMATED" or "MANUAL".
 *
 * Replace the body of `classify()` with a real AI call (e.g. Claude)
 * when you're ready to integrate.
 */

/**
 * Classify an issue report as AUTOMATED or MANUAL.
 *
 * @param  {Object} issue - { issueTitle, issueDescription, stepsToReproduce, severity }
 * @return {Promise<{ decision: string, confidence: number, reasoning: string }>}
 */
async function classify(issue) {
    // Simulate network latency
    await delay(300);

    // Simple heuristic mock: high/critical severity → MANUAL, otherwise AUTOMATED
    const severityLower = (issue.severity || '').toLowerCase();
    const isHighRisk = ['critical', 'high'].includes(severityLower);

    const decision = isHighRisk ? 'MANUAL' : 'AUTOMATED';
    const confidence = isHighRisk ? 0.85 : 0.92;
    const reasoning = isHighRisk
        ? `Severity "${issue.severity}" indicates a high-risk issue that requires human review.`
        : `Severity "${issue.severity}" is low enough for an automated fix.`;

    console.log(`🤖  [Classifier] Decision: ${decision} (confidence: ${confidence})`);
    console.log(`    Reasoning: ${reasoning}`);

    return { decision, confidence, reasoning };
}

// ── Helpers ──────────────────────────────────────────────
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { classify };
