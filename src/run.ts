import * as core from '@actions/core';
import * as github from '@actions/github';
import { load } from "js-yaml";
import { readFileSync } from "fs";

interface Input {
  token: string;
  org: string;
  file: string;
}

interface teamType {
  [key: string]: string[];
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

    input.file = 'repos.yml';
    const teams: teamType = load(readFileSync(input.file));
    for (const [_, repos] of Object.entries(teams)) {
      repos.forEach((repo) => {
        core.info(`repo: ${repo}`);
      });
    }

    const octokit: ReturnType<typeof github.getOctokit> = github.getOctokit(input.token);

    const orgRet = await octokit.request(`GET /orgs/${input.org}/repos`);

    for (const repo of orgRet.data) {
      core.info(`REPO: ${JSON.stringify(repo)}`);
      core.info(`PATCH /repos/${input.org}/${repo.name}`);
      try {
        const res = await octokit.request(`PATCH /repos/${input.org}/${repo.name}`, {
          security_and_analysis: { advanced_security: { status: "enabled" } }
        });
        core.info(`ret: ${JSON.stringify(res)}`)
      } catch (error) {
        core.warning(error instanceof Error ? error.message : JSON.stringify(error));
      }
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
