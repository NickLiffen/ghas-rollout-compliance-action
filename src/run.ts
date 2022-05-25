import * as core from '@actions/core';
import * as github from '@actions/github';

interface Input {
  token: string;
  org: string;
  file: string;
}

export function getInputs(): Input {
  const result = {} as Input;
  result.token = core.getInput('github-token');
  result.org = core.getInput('org');
  result.file = core.getInput('file');
  return result;
}

const run = async (): Promise<void> => {
  try {
    const input = getInputs();
    const octokit: ReturnType<typeof github.getOctokit> = github.getOctokit(input.token);

    const org = 'austenstone';
    const repo = 'ghas-rollout-compliance-action';

    const orgs = await octokit.request(`GET /orgs/${org}/repos`, {
      org: input.org
    });
    core.info(`${JSON.stringify(orgs)}`)

    const res = await octokit.request(`PATCH /repos/${org}/${repo}`, {
      security_and_analysis: { advanced_security: { status: "enabled" } }
    });
    core.info(`${JSON.stringify(res)}`)

    core.info(`Hello, ${org}!`);
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
