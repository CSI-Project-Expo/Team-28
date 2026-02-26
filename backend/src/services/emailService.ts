/**
 * services/emailService.ts
 *
 * Sends email notifications via SMTP using Nodemailer.
 *
 * Keys used: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, NOTIFICATION_EMAIL
 *
 * When to send:
 *  - AI classifies issue as MANUAL → notify admin to review
 *  - Automated fix attempted (success or failure) → send summary
 */
import nodemailer from 'nodemailer';
import { Issue } from '../utils/types';
import { logger } from '../utils/logger';

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM_ADDRESS = `"Site Surgeon 🤖" <${process.env.SMTP_USER}>`;
const TO_ADDRESS = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER || '';

/**
 * Notify admin that an issue requires manual review.
 */
export async function sendManualReviewEmail(issue: Issue): Promise<void> {
  const transport = createTransport();

  const subject = `[Site Surgeon] Manual Review Required: ${issue.title}`;

  const html = `
<div style="font-family:sans-serif;max-width:640px;margin:auto">
  <h2 style="color:#e53e3e">⚠️ Manual Review Required</h2>
  <p>The AI classified the following bug report as <strong>requiring human review</strong>.</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#f7fafc;width:160px"><strong>Issue ID</strong></td><td style="padding:8px">${issue.id}</td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Title</strong></td><td style="padding:8px">${issue.title}</td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Severity</strong></td><td style="padding:8px">${issue.severity.toUpperCase()}</td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Repository</strong></td><td style="padding:8px"><a href="${issue.repoUrl}">${issue.repoUrl}</a></td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>AI Reason</strong></td><td style="padding:8px">${issue.aiReason || '—'}</td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Reported At</strong></td><td style="padding:8px">${issue.createdAt}</td></tr>
  </table>

  <h3>Description</h3>
  <p>${issue.description}</p>

  <h3>Steps to Reproduce</h3>
  <pre style="background:#f7fafc;padding:12px;border-radius:4px">${issue.stepsToReproduce}</pre>

  <hr/>
  <p style="color:#718096;font-size:12px">This notification was sent by Site Surgeon – AI Self-Healing Web System.</p>
</div>`;

  await transport.sendMail({ from: FROM_ADDRESS, to: TO_ADDRESS, subject, html });
  logger.info('Manual review email sent', { issueId: issue.id, to: TO_ADDRESS });
}

/**
 * Notify admin about an automated fix result.
 */
export async function sendAutomatedFixEmail(
  issue: Issue,
  prUrl: string,
  merged: boolean,
  patchSummary: string
): Promise<void> {
  const transport = createTransport();

  const statusLabel = merged ? '✅ Merged' : '📋 PR Opened (pending review)';
  const subject = `[Site Surgeon] Automated Fix ${merged ? 'Merged' : 'PR Opened'}: ${issue.title}`;

  const html = `
<div style="font-family:sans-serif;max-width:640px;margin:auto">
  <h2 style="color:#38a169">🤖 Automated Fix Applied</h2>
  <p>Site Surgeon successfully analysed and fixed the following bug report.</p>
  <p><strong>Status:</strong> ${statusLabel}</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0">
    <tr><td style="padding:8px;background:#f7fafc;width:160px"><strong>Issue ID</strong></td><td style="padding:8px">${issue.id}</td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Title</strong></td><td style="padding:8px">${issue.title}</td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Severity</strong></td><td style="padding:8px">${issue.severity.toUpperCase()}</td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Repository</strong></td><td style="padding:8px"><a href="${issue.repoUrl}">${issue.repoUrl}</a></td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>Pull Request</strong></td><td style="padding:8px"><a href="${prUrl}">${prUrl}</a></td></tr>
    <tr><td style="padding:8px;background:#f7fafc"><strong>AI Decision</strong></td><td style="padding:8px">${issue.aiDecision}</td></tr>
  </table>

  <h3>What Was Fixed</h3>
  <p>${patchSummary || 'See Pull Request for full diff.'}</p>

  <a href="${prUrl}" style="display:inline-block;padding:10px 20px;background:#3182ce;color:#fff;border-radius:4px;text-decoration:none;margin-top:12px">
    View Pull Request →
  </a>

  <hr style="margin-top:24px"/>
  <p style="color:#718096;font-size:12px">This notification was sent by Site Surgeon – AI Self-Healing Web System.</p>
</div>`;

  await transport.sendMail({ from: FROM_ADDRESS, to: TO_ADDRESS, subject, html });
  logger.info('Automated fix email sent', { issueId: issue.id, prUrl });
}
