const { classify } = require('../services/classifierService');
const { createPR, autoMergePR } = require('../services/githubService');
const { sendNotification } = require('../services/emailService');

/**
 * POST /api/report
 *
 * Orchestrates the self-healing pipeline:
 *   1. Validate input
 *   2. AI classification → AUTOMATED | MANUAL
 *   3. Create PR (simulated)
 *   4. Auto-merge (AUTOMATED) or send email notification (MANUAL)
 */
async function handleReport(req, res, next) {
    try {
        const { issueTitle, issueDescription, stepsToReproduce, severity } = req.body;

        // ── Validation ────────────────────────────────────────
        if (!issueTitle || !issueDescription || !severity) {
            return res.status(400).json({
                success: false,
                message: '"issueTitle", "issueDescription", and "severity" are required.',
            });
        }

        const issueData = {
            issueTitle,
            issueDescription,
            stepsToReproduce: stepsToReproduce || '',
            severity,
        };

        console.log(`\n📥  New issue reported: "${issueTitle}" [${severity}]`);

        // ── Step 1: AI Classification ─────────────────────────
        const classification = await classify(issueData);

        // ── Step 2: Create Pull Request ───────────────────────
        const pr = await createPR(issueData);

        // ── Step 3: Resolution ────────────────────────────────
        let resolution;

        if (classification.decision === 'AUTOMATED') {
            await autoMergePR(pr);
            resolution = 'merged';
        } else {
            await sendNotification({
                issueTitle,
                prUrl: pr.html_url,
                prNumber: pr.number,
                reasoning: classification.reasoning,
            });
            resolution = 'pending_review';
        }

        console.log(`🏁  Pipeline complete → ${resolution}\n`);

        return res.status(201).json({
            success: true,
            data: {
                classification: classification.decision,
                confidence: classification.confidence,
                reasoning: classification.reasoning,
                pr: {
                    number: pr.number,
                    url: pr.html_url,
                },
                resolution,
            },
        });
    } catch (error) {
        next(error);
    }
}

module.exports = { handleReport };
