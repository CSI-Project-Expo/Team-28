/**
 * sandbox/sandboxManager.ts
 *
 * Manages E2B cloud sandbox instances (e2b SDK v0.x).
 * Uses sandbox.process.startAndWait() for shell commands and
 * sandbox.filesystem.read/write for file operations.
 *
 * Key used: E2B_API_KEY
 */
import { Sandbox } from 'e2b';
import { logger } from '../utils/logger';

export interface SandboxContext {
  sandbox: Sandbox;
  sandboxId: string;
  repoDir: string;
  logs: string[];
}

/**
 * Parse a GitHub URL like https://github.com/owner/repo[.git][/...]
 * into a bare clone URL.
 */
function toCloneUrl(repoUrl: string): string {
  const cleaned = repoUrl.replace(/\/$/, '').replace(/\.git$/, '');
  return cleaned + '.git';
}

/**
 * Get the repo name from the URL (used as the local directory name).
 */
function repoName(repoUrl: string): string {
  const parts = repoUrl.replace(/\.git$/, '').split('/');
  return parts[parts.length - 1] || 'repo';
}

/** Run a shell command inside the sandbox */
async function exec(
  sandbox: Sandbox,
  cmd: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const out = await sandbox.process.startAndWait({ cmd });
  return {
    stdout: out.stdout,
    stderr: out.stderr,
    exitCode: out.exitCode ?? 0,
  };
}

/**
 * Create and configure a new E2B sandbox.
 */
export async function createSandbox(repoUrl: string): Promise<SandboxContext> {
  logger.info('Creating E2B sandbox', { repoUrl });

  const sandbox = await Sandbox.create({
    apiKey: process.env.E2B_API_KEY,
    timeout: 5 * 60, // 5 minutes in seconds
  });

  const sandboxId = sandbox.id;
  const repoDir = `/home/user/${repoName(repoUrl)}`;
  const logs: string[] = [];

  logger.info('Sandbox created', { sandboxId });
  logs.push(`Sandbox created: ${sandboxId}`);

  return { sandbox, sandboxId, repoDir, logs };
}

/**
 * Clone the repository into the sandbox.
 */
export async function cloneRepo(ctx: SandboxContext, repoUrl: string): Promise<void> {
  const cloneUrl = toCloneUrl(repoUrl);
  logger.info('Cloning repository', { cloneUrl, sandboxId: ctx.sandboxId });

  const { stdout, stderr, exitCode } = await exec(
    ctx.sandbox,
    `git clone --depth 1 "${cloneUrl}" "${ctx.repoDir}" 2>&1`
  );

  ctx.logs.push(`[clone] ${stdout || stderr}`);

  if (exitCode !== 0) {
    throw new Error(`git clone failed (exit ${exitCode}): ${stderr || stdout}`);
  }

  logger.info('Repository cloned', { repoDir: ctx.repoDir });
}

/**
 * Detect the package manager used and install dependencies.
 */
export async function installDependencies(ctx: SandboxContext): Promise<void> {
  logger.info('Detecting package manager', { sandboxId: ctx.sandboxId });

  const detectScript = [
    `cd "${ctx.repoDir}"`,
    `if [ -f package-lock.json ]; then echo "npm"`,
    `elif [ -f yarn.lock ]; then echo "yarn"`,
    `elif [ -f pnpm-lock.yaml ]; then echo "pnpm"`,
    `elif [ -f requirements.txt ]; then echo "pip"`,
    `elif [ -f pyproject.toml ]; then echo "pyproject"`,
    `else echo "none"; fi`,
  ].join(' && ');

  const { stdout: pmRaw } = await exec(ctx.sandbox, `bash -c '${detectScript}'`);
  const pkgMgr = pmRaw.trim();
  ctx.logs.push(`[detect] Package manager: ${pkgMgr}`);

  if (pkgMgr === 'none') {
    ctx.logs.push('[install] No package manager detected, skipping.');
    return;
  }

  const installCmds: Record<string, string> = {
    npm:       `cd "${ctx.repoDir}" && npm install --legacy-peer-deps 2>&1`,
    yarn:      `cd "${ctx.repoDir}" && yarn install --non-interactive 2>&1`,
    pnpm:      `cd "${ctx.repoDir}" && pnpm install --frozen-lockfile 2>&1`,
    pip:       `cd "${ctx.repoDir}" && pip install -r requirements.txt 2>&1`,
    pyproject: `cd "${ctx.repoDir}" && pip install . 2>&1`,
  };

  const cmd = installCmds[pkgMgr];
  if (!cmd) return;

  const { stdout, exitCode } = await exec(ctx.sandbox, cmd);
  ctx.logs.push(`[install] ${stdout.slice(-2000)}`);

  if (exitCode !== 0) {
    logger.warn('Dependency install returned non-zero exit code', { exitCode });
  }
}

/**
 * Read the contents of a file inside the sandbox.
 */
export async function readFile(ctx: SandboxContext, absolutePath: string): Promise<string> {
  return await ctx.sandbox.filesystem.read(absolutePath);
}

/**
 * List all files in the repository (excluding node_modules, .git, dist, etc.).
 */
export async function listRepoFiles(ctx: SandboxContext): Promise<string[]> {
  const IGNORE = '.git node_modules dist build .next __pycache__ venv .env coverage';
  const prune = IGNORE.split(' ')
    .map((d) => `-name "${d}" -prune`)
    .join(' -o ');
  const cmd = `find "${ctx.repoDir}" \\( ${prune} \\) -o -type f -print 2>/dev/null`;
  const { stdout } = await exec(ctx.sandbox, cmd);
  return stdout
    .split('\n')
    .map((line: string) => line.replace(`${ctx.repoDir}/`, '').trim())
    .filter((f: string) => f.length > 0);
}

/**
 * Write a patched file back into the sandbox.
 */
export async function writeFile(
  ctx: SandboxContext,
  relativePath: string,
  content: string
): Promise<void> {
  const fullPath = `${ctx.repoDir}/${relativePath}`;
  const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
  await exec(ctx.sandbox, `mkdir -p "${dir}"`);
  await ctx.sandbox.filesystem.write(fullPath, content);
  ctx.logs.push(`[write] ${relativePath}`);
}

/**
 * Attempt to run tests or build inside the sandbox.
 * Returns stdout/stderr (truncated).
 */
export async function runTestsOrBuild(
  ctx: SandboxContext
): Promise<{ success: boolean; output: string }> {
  logger.info('Running tests / build', { sandboxId: ctx.sandboxId });

  // Read package.json to decide what to run
  let pkgJson: { scripts?: Record<string, string> } = {};
  try {
    const raw = await ctx.sandbox.filesystem.read(`${ctx.repoDir}/package.json`);
    pkgJson = JSON.parse(raw) as { scripts?: Record<string, string> };
  } catch {
    // Not a Node project – try pytest
    const { stdout, exitCode } = await exec(
      ctx.sandbox,
      `cd "${ctx.repoDir}" && python -m pytest --tb=short -q 2>&1 || true`
    );
    ctx.logs.push(`[test] ${stdout.slice(-2000)}`);
    return { success: exitCode === 0, output: stdout };
  }

  const scripts = pkgJson.scripts ?? {};
  let cmd: string;

  if (scripts['test']) {
    cmd = `cd "${ctx.repoDir}" && npm test -- --passWithNoTests 2>&1`;
  } else if (scripts['build']) {
    cmd = `cd "${ctx.repoDir}" && npm run build 2>&1`;
  } else {
    ctx.logs.push('[test/build] No test or build script found.');
    return { success: true, output: 'No test/build script configured.' };
  }

  const { stdout, exitCode } = await exec(ctx.sandbox, cmd);
  ctx.logs.push(`[test/build] success=${exitCode === 0}`);
  ctx.logs.push(`[test/build] ${stdout.slice(-2000)}`);
  return { success: exitCode === 0, output: stdout };
}

/**
 * Destroy the sandbox (always call in a finally block).
 */
export async function destroySandbox(ctx: SandboxContext): Promise<void> {
  try {
    await ctx.sandbox.close();
    logger.info('Sandbox destroyed', { sandboxId: ctx.sandboxId });
  } catch {
    logger.warn('Failed to destroy sandbox (may have already timed out)', {
      sandboxId: ctx.sandboxId,
    });
  }
}
