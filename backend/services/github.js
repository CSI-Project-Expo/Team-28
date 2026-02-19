const { Octokit } = require('@octokit/rest');

function getOctokit() {
    return new Octokit({ auth: process.env.GITHUB_TOKEN });
}

const owner = () => process.env.GITHUB_OWNER;
const repo = () => process.env.GITHUB_REPO;
const defaultBranch = () => process.env.GITHUB_DEFAULT_BRANCH || 'main';

/**
 * Create a Pull Request from the given branch into the default branch.
 *
 * @param  {Object} options       – { title, body, branch }
 * @return {Object}               – GitHub PR object (number, html_url, …)
 */
async function createPullRequest({ title, body, branch }) {
    const octokit = getOctokit();

    const { data: pr } = await octokit.pulls.create({
        owner: owner(),
        repo: repo(),
        title,
        body,
        head: branch,
        base: defaultBranch(),
    });

    return pr;
}

/**
 * Merge (squash) the given Pull Request.
 *
 * @param {number} prNumber
 */
async function mergePullRequest(prNumber) {
    const octokit = getOctokit();

    await octokit.pulls.merge({
        owner: owner(),
        repo: repo(),
        pull_number: prNumber,
        merge_method: 'squash',
    });
}

module.exports = { createPullRequest, mergePullRequest };
