const nodemailer = require('nodemailer');

/**
 * Create a reusable SMTP transporter from environment variables.
 */
function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

/**
 * Send an email to the admin requesting manual review of a PR.
 *
 * @param {Object} options – { issueTitle, prUrl, prNumber, reasoning }
 */
async function sendManualReviewEmail({ issueTitle, prUrl, prNumber, reasoning }) {
    const transporter = createTransporter();

    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d97706;">🔍 Manual Review Required</h2>
      <p>The AI Self-Healing System has created a fix that requires your review.</p>

      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Issue</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${issueTitle}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">PR #</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${prNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold; background: #f9fafb;">Reasoning</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${reasoning}</td>
        </tr>
      </table>

      <a href="${prUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px;">
        Review Pull Request →
      </a>

      <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">
        — AI Self-Healing System
      </p>
    </div>
  `;

    await transporter.sendMail({
        from: `"Self-Heal Bot" <${process.env.SMTP_USER}>`,
        to: process.env.NOTIFICATION_EMAIL,
        subject: `[Manual Review] Self-Healing Fix: ${issueTitle}`,
        html,
    });

    console.log(`    📧 Email sent to ${process.env.NOTIFICATION_EMAIL}`);
}

module.exports = { sendManualReviewEmail };
