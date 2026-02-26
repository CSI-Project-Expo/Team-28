/**
 * services/aiClassifier.ts
 *
 * Uses Anthropic Claude to decide whether a bug report should be handled
 * automatically by the AI agent or escalated to a human admin.
 *
 * Key used: ANTHROPIC_API_KEY
 */
import Anthropic from '@anthropic-ai/sdk';
import { ClassificationResult, Issue } from '../utils/types';
import { logger } from '../utils/logger';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = 'claude-3-5-sonnet-20241022';

/**
 * System prompt that instructs Claude how to classify issues.
 */
const SYSTEM_PROMPT = `You are a senior software engineering triage assistant for an AI self-healing web system called "Site Surgeon".

Your job is to classify incoming bug reports and decide one of two things:
1. AUTOMATED – The bug is simple enough that an AI coding agent can likely fix it automatically.
2. MANUAL – The bug is too complex, too risky, or too ambiguous for automated fixing and requires human review.

Rules for AUTOMATED classification:
- Typos, text changes, small CSS/style fixes
- Simple logic errors with a clear expected behaviour
- Missing null checks or guard clauses
- Small configuration changes
- Bugs with a clear reproduction path in a well-known framework
- Severity is "low" or "medium"

Rules for MANUAL classification:
- Security vulnerabilities (SQL injection, XSS, auth bypass, etc.)
- Data-loss risks
- Architecture changes required
- Critical severity bugs with unclear reproduction
- Bugs requiring business-logic decisions
- Anything involving payments, PII, or sensitive data

Always respond with VALID JSON only. Do not wrap in markdown. Use this exact schema:
{
  "decision": "AUTOMATED" | "MANUAL",
  "reason": "<one paragraph explanation>",
  "confidence": <integer 0-100>
}`;

/**
 * Classify a bug report using Claude.
 */
export async function classifyIssue(issue: Issue): Promise<ClassificationResult> {
  logger.info('Classifying issue with Claude', { issueId: issue.id });

  const userMessage = `
Bug Report:
- Title: ${issue.title}
- Severity: ${issue.severity}
- Description: ${issue.description}
- Steps to Reproduce: ${issue.stepsToReproduce}
- Repository: ${issue.repoUrl}

Please classify this bug report.
`.trim();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text.trim();

  let parsed: ClassificationResult;
  try {
    parsed = JSON.parse(raw) as ClassificationResult;
  } catch {
    logger.error('Failed to parse Claude classification response', { raw });
    // Fallback to MANUAL when we can't parse
    parsed = { decision: 'MANUAL', reason: 'Failed to parse AI response.', confidence: 0 };
  }

  logger.info('Classification result', {
    issueId: issue.id,
    decision: parsed.decision,
    confidence: parsed.confidence,
  });

  return parsed;
}
