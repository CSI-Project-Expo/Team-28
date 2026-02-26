/**
 * services/issueProcessor.ts
 *
 * The main orchestration pipeline that ties every service together.
 *
 * Full flow:
 *   receive issue → classify (AI) → sandbox → agent → GitHub → email/merge
 */
import { v4 as uuidv4 } from 'uuid';
import { Issue, ReportIssueBody } from '../utils/types';
import { issueStore } from '../utils/store';
import { classifyIssue } from './aiClassifier';
import {
  createSandbox,
  cloneRepo,
  installDependencies,
  destroySandbox,
  SandboxContext,
} from '../sandbox/sandboxManager';
import { runCodingAgent } from '../agents/codingAgent';
import { createAndSubmitFix } from './githubService';
import { sendManualReviewEmail, sendAutomatedFixEmail } from './emailService';
import { logger } from '../utils/logger';

// ── Helpers ───────────────────────────────────────────────────────────────────

function updateStatus(id: string, partial: Partial<Issue>) {
  issueStore.update(id, partial);
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function processIssue(body: ReportIssueBody): Promise<Issue> {
  const issue: Issue = {
    id: uuidv4(),
    title: body.title,
    description: body.description,
    stepsToReproduce: body.stepsToReproduce,
    severity: body.severity,
    repoUrl: body.repoUrl,
    status: 'received',
    sandboxLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  issueStore.save(issue);
  logger.info('Issue received', { issueId: issue.id, title: issue.title });

  // Run the full pipeline asynchronously so the HTTP response returns immediately
  runPipeline(issue).catch((err) => {
    logger.error('Pipeline crashed', {
      issueId: issue.id,
      error: err instanceof Error ? err.message : String(err),
    });
    updateStatus(issue.id, { status: 'failed' });
  });

  return issue;
}

async function runPipeline(issue: Issue): Promise<void> {
  // ── Step 1: AI Classification ────────────────────────────────────────────
  updateStatus(issue.id, { status: 'classifying' });

  const classification = await classifyIssue(issue);
  updateStatus(issue.id, {
    aiDecision: classification.decision,
    aiReason: classification.reason,
  });

  logger.info('Issue classified', {
    issueId: issue.id,
    decision: classification.decision,
    confidence: classification.confidence,
  });

  // ── Step 2: Manual path ──────────────────────────────────────────────────
  if (classification.decision === 'MANUAL') {
    try {
      await sendManualReviewEmail({ ...issue, aiDecision: classification.decision, aiReason: classification.reason });
    } catch (emailErr) {
      logger.warn('Failed to send manual review email', {
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }
    updateStatus(issue.id, { status: 'notified' });
    logger.info('Manual review notification sent', { issueId: issue.id });
    return;
  }

  // ── Step 3: Automated path → Sandbox ────────────────────────────────────
  updateStatus(issue.id, { status: 'sandboxing' });

  let ctx: SandboxContext | null = null;

  try {
    ctx = await createSandbox(issue.repoUrl);
    updateStatus(issue.id, { sandboxId: ctx.sandboxId });

    await cloneRepo(ctx, issue.repoUrl);
    await installDependencies(ctx);

    appendLogs(issue.id, ctx.logs);

    // ── Step 4: AI Coding Agent ──────────────────────────────────────────
    updateStatus(issue.id, { status: 'fixing' });

    const agentResult = await runCodingAgent(issue, ctx);
    appendLogs(issue.id, agentResult.logs);

    if (!agentResult.success || agentResult.filesChanged.length === 0) {
      logger.warn('Agent could not produce a fix – escalating to MANUAL', {
        issueId: issue.id,
        error: agentResult.error,
      });
      updateStatus(issue.id, { aiDecision: 'MANUAL', aiReason: `Agent failed: ${agentResult.error}` });
      await sendManualReviewEmail({ ...issue, aiDecision: 'MANUAL', aiReason: agentResult.error });
      updateStatus(issue.id, { status: 'notified' });
      return;
    }

    // Build file-content map for GitHub service
    // We need the actual post-fix content; read it back from the sandbox
    const { readFile } = await import('../sandbox/sandboxManager');
    const filesForGithub: Array<{ path: string; content: string }> = [];

    for (const relPath of agentResult.filesChanged) {
      try {
        const content = await readFile(ctx, `${ctx.repoDir}/${relPath}`);
        filesForGithub.push({ path: relPath, content });
      } catch {
        logger.warn('Could not read fixed file back from sandbox', { relPath });
      }
    }

    // ── Step 5: GitHub Operations ────────────────────────────────────────
    const prResult = await createAndSubmitFix(
      issue,
      filesForGithub,
      agentResult.commitMessage,
      agentResult.patch,
      true // autoMerge = true for AUTOMATED
    );

    updateStatus(issue.id, {
      status: 'pr_opened',
      branchName: prResult.branchName,
      prUrl: prResult.prUrl,
      patchSummary: agentResult.patch,
      commitMessage: agentResult.commitMessage,
    });

    if (prResult.merged) {
      updateStatus(issue.id, { status: 'merged' });
    }

    // ── Step 6: Email summary ────────────────────────────────────────────
    try {
      await sendAutomatedFixEmail(
        { ...issue, ...issueStore.findById(issue.id) } as Issue,
        prResult.prUrl,
        prResult.merged,
        agentResult.patch
      );
    } catch (emailErr) {
      logger.warn('Failed to send automated fix email', {
        error: emailErr instanceof Error ? emailErr.message : String(emailErr),
      });
    }

    logger.info('Pipeline complete', {
      issueId: issue.id,
      prUrl: prResult.prUrl,
      merged: prResult.merged,
    });
  } finally {
    if (ctx) {
      await destroySandbox(ctx);
    }
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function appendLogs(issueId: string, newLogs: string[]) {
  const existing = issueStore.findById(issueId);
  if (!existing) return;
  issueStore.update(issueId, {
    sandboxLogs: [...existing.sandboxLogs, ...newLogs],
  });
}
