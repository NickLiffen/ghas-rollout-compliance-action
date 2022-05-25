import * as core from '@actions/core';
import * as github from '@actions/github';

interface Input {
  token: string;
  org: string;
  repo: string;
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
    core.debug(`INPUTS ${JSON.stringify(input)}`)

    const octokit: ReturnType<typeof github.getOctokit> = github.getOctokit(input.token);

    const orgs = await octokit.request(`GET /orgs/${input.org}/repos`, {
      org: input.org
    });
    core.debug(`${JSON.stringify(orgs)}`)

    const res = await octokit.request(`PATCH /repos/${input.org}/${input.repo}`, {
      security_and_analysis: { advanced_security: { status: "enabled" } }
    });
    core.debug(`${JSON.stringify(res)}`)

    core.debug(`Hello, ${input.org}!`);
  } catch (error) {
    core.debug(JSON.stringify(error));
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
