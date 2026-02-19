const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Analyse an issue report and decide whether it can be fixed
 * automatically or needs manual human review.
 *
 * @param  {Object} issue  – { title, description, stepsToReproduce, expectedBehavior, actualBehavior }
 * @return {Object}        – { decision: 'AUTOMATED'|'MANUAL', confidence: number, reasoning: string }
 */
async function triageIssue(issue) {
    const systemPrompt = `You are an expert software triage engineer.
You will receive a bug / issue report for a web application.

Analyse the report and decide:
  • AUTOMATED – the fix is straightforward, low-risk, and can be safely auto-merged.
  • MANUAL    – the fix is complex, ambiguous, or risky and requires human review.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "decision": "AUTOMATED" | "MANUAL",
  "confidence": <number between 0 and 1>,
  "reasoning": "<short explanation>"
}`;

    const userPrompt = `
Issue Title: ${issue.title}
Description: ${issue.description}
Steps to Reproduce: ${issue.stepsToReproduce || 'N/A'}
Expected Behavior: ${issue.expectedBehavior || 'N/A'}
Actual Behavior: ${issue.actualBehavior || 'N/A'}
`;

    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
    });

    const text = response.content[0].text.trim();

    try {
        return JSON.parse(text);
    } catch {
        console.warn('⚠️  Could not parse triage response, falling back to MANUAL.');
        return {
            decision: 'MANUAL',
            confidence: 0,
            reasoning: `AI response could not be parsed: ${text}`,
        };
    }
}

module.exports = { triageIssue };
