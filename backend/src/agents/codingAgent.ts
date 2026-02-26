/**
 * agents/codingAgent.ts
 *
 * The AI Coding Agent is a multi-step reasoning process powered by Claude.
 * It receives the bug report + the repository's file listing + file contents
 * and produces a concrete code fix (patch) with a commit message.
 *
 * Key used: ANTHROPIC_API_KEY
 *
 * Strategy (ReAct-style loop):
 *   1. Ask Claude to identify which files are most relevant.
 *   2. Read those files from the sandbox.
 *   3. Ask Claude to generate fixed versions of each file.
 *   4. Write each fixed file back into the sandbox.
 *   5. Run tests / build to validate.
 *   6. Return the AgentResult.
 */
import Anthropic from '@anthropic-ai/sdk';
import { Issue, AgentResult } from '../utils/types';
import { SandboxContext, listRepoFiles, readFile, writeFile } from '../sandbox/sandboxManager';
import { logger } from '../utils/logger';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-3-5-sonnet-20241022';

//─── Prompts ──────────────────────────────────────────────────────────────────

const FILE_SCOUT_SYSTEM = `You are a senior software engineer.
Given a bug report and the full list of files in a repository, identify which files (up to 5) are most likely to contain the bug.
Respond with VALID JSON only. No markdown. Schema:
{ "files": ["path/to/file1.ts", "path/to/file2.ts"] }`;

const FIX_SYSTEM = `You are an expert software engineer performing automated bug fixing.
You will receive a bug description, reproduction steps, and the relevant source files.
Your task is to produce fixed versions of all files that need changes.

Rules:
- Only change what is necessary to fix the reported bug.
- Do NOT refactor unrelated code.
- Do NOT change import paths or package names.
- Always provide the COMPLETE file content (not a diff) so it can be written directly.
- If a file does not need changes, omit it.

Respond with VALID JSON only. No markdown. Schema:
{
  "commitMessage": "<imperative short commit message, max 72 chars>",
  "patchSummary": "<one-paragraph human-readable explanation of the fix>",
  "files": [
    { "path": "relative/path/from/repo/root.ts", "content": "<full file content>" }
  ]
}`;

//─── Helpers ──────────────────────────────────────────────────────────────────

async function identifyRelevantFiles(
  issue: Issue,
  allFiles: string[]
): Promise<string[]> {
  const fileList = allFiles.slice(0, 300).join('\n'); // cap to avoid token overflow

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: FILE_SCOUT_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Bug Title: ${issue.title}
Description: ${issue.description}
Steps to Reproduce: ${issue.stepsToReproduce}

Repository files:
${fileList}`,
      },
    ],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
  try {
    const parsed = JSON.parse(raw) as { files: string[] };
    return parsed.files.slice(0, 5);
  } catch {
    // fallback: pick first 3 .ts/.js/.py files
    return allFiles
      .filter((f) => /\.(ts|js|tsx|jsx|py)$/.test(f))
      .slice(0, 3);
  }
}

interface FixResponse {
  commitMessage: string;
  patchSummary: string;
  files: Array<{ path: string; content: string }>;
}

async function generateFix(
  issue: Issue,
  fileContents: Record<string, string>
): Promise<FixResponse> {
  const fileBlocks = Object.entries(fileContents)
    .map(([path, content]) => `=== FILE: ${path} ===\n${content}`)
    .join('\n\n');

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    system: FIX_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `Bug Report:
Title: ${issue.title}
Severity: ${issue.severity}
Description: ${issue.description}
Steps to Reproduce: ${issue.stepsToReproduce}

Source Files:
${fileBlocks}`,
      },
    ],
  });

  const raw = (response.content[0] as Anthropic.TextBlock).text.trim();
  try {
    return JSON.parse(raw) as FixResponse;
  } catch {
    throw new Error('Claude returned invalid JSON for fix response:\n' + raw);
  }
}

//─── Main Agent ───────────────────────────────────────────────────────────────

/**
 * Run the full AI coding agent pipeline inside a sandbox context.
 */
export async function runCodingAgent(
  issue: Issue,
  ctx: SandboxContext
): Promise<AgentResult> {
  const agentLogs: string[] = [];

  try {
    // Step 1: List all files
    agentLogs.push('Step 1: Listing repository files...');
    const allFiles = await listRepoFiles(ctx);
    agentLogs.push(`Found ${allFiles.length} files.`);
    logger.info('Agent listed repo files', { count: allFiles.length });

    // Step 2: Ask Claude which files are relevant
    agentLogs.push('Step 2: Identifying relevant files...');
    const relevantFiles = await identifyRelevantFiles(issue, allFiles);
    agentLogs.push(`Relevant files: ${relevantFiles.join(', ')}`);
    logger.info('Relevant files identified', { relevantFiles });

    // Step 3: Read those files from sandbox
    agentLogs.push('Step 3: Reading relevant files...');
    const fileContents: Record<string, string> = {};
    for (const filePath of relevantFiles) {
      try {
        const content = await readFile(ctx, `${ctx.repoDir}/${filePath}`);
        fileContents[filePath] = content;
        agentLogs.push(`Read: ${filePath} (${content.length} chars)`);
      } catch (err) {
        agentLogs.push(`Skipped (read error): ${filePath}`);
      }
    }

    if (Object.keys(fileContents).length === 0) {
      throw new Error('Could not read any relevant files from the sandbox.');
    }

    // Step 4: Generate the fix
    agentLogs.push('Step 4: Generating fix with Claude...');
    const fixResponse = await generateFix(issue, fileContents);
    agentLogs.push(`Fix generated. Files changed: ${fixResponse.files.length}`);
    agentLogs.push(`Commit message: ${fixResponse.commitMessage}`);
    logger.info('Fix generated', { filesChanged: fixResponse.files.length });

    // Step 5: Write fixed files back into sandbox
    agentLogs.push('Step 5: Writing fixed files to sandbox...');
    for (const { path, content } of fixResponse.files) {
      await writeFile(ctx, path, content);
      agentLogs.push(`Written: ${path}`);
    }

    // Build a unified-diff-like patch summary for the PR body
    const patch = fixResponse.files
      .map((f) => `## ${f.path}\n\`\`\`\n${f.content.slice(0, 500)}...\n\`\`\``)
      .join('\n\n');

    return {
      success: true,
      patch,
      commitMessage: fixResponse.commitMessage,
      filesChanged: fixResponse.files.map((f) => f.path),
      logs: agentLogs,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    agentLogs.push(`Agent error: ${message}`);
    logger.error('Coding agent failed', { error: message });
    return {
      success: false,
      patch: '',
      commitMessage: '',
      filesChanged: [],
      logs: agentLogs,
      error: message,
    };
  }
}
