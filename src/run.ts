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

    core.info(`INPUTS ${JSON.stringify(input)}`)

    const octokit: ReturnType<typeof github.getOctokit> = github.getOctokit(input.token);

    const orgRet = await octokit.request(`GET /orgs/${input.org}/repos`, {
      org: input.org
    });
    core.info(`ORGS: ${JSON.stringify(orgRet)}`)

    for (const repo of orgRet.data) {
      core.info(`REPO: ${JSON.stringify(repo)}`);
      const res = await octokit.request(`PATCH /repos/${input.org}/${repo}`, {
        security_and_analysis: { advanced_security: { status: "enabled" } }
      });
      core.info(`OK: ${JSON.stringify(res)}`)
    }


    core.info(`Hello, ${input.org}!`);
  } catch (error) {
    core.info(JSON.stringify(error));
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
