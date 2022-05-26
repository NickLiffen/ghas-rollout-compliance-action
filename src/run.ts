import * as core from '@actions/core';
import * as github from '@actions/github';
import { load } from "js-yaml";
import { readFileSync } from "fs";

interface Input {
  token: string;
  org: string;
  file: string;
  forceEnable: boolean;
}

export function getInputs(): Input {
  const result = {} as Input;
  result.token = core.getInput('github-token');
  result.org = core.getInput('org');
  result.file = core.getInput('file');
  result.forceEnable = core.getBooleanInput('force-enable');
  return result;
}

const run = async (): Promise<void> => {
  try {
    const input = getInputs();

    const reposAllowed = {};
    const teams: {
      [key: string]: string[];
    } = load(readFileSync(input.file));
    for (const [_, repos] of Object.entries(teams)) {
      repos.forEach((repo) => reposAllowed[repo] = true);
    }

    const octokit: ReturnType<typeof github.getOctokit> = github.getOctokit(input.token);

    const orgRet = await octokit.request(`GET /orgs/${input.org}/repos`);
    for (const repo of orgRet.data) {
      const status = reposAllowed[repo.name] ? 'enabled' : 'disabled';
      if (input.forceEnable === false && status === 'enabled') continue;
      try {
        await octokit.request(`PATCH /repos/${input.org}/${repo.name}`, {
          security_and_analysis: { advanced_security: { status } }
        });
        core.info(`${input.org}/${repo.name}: ${status}`);
      } catch (error) {
        core.warning(error instanceof Error ? error.message : JSON.stringify(error));
      }
    }

    const ghasCommitters = {};
    const billingRet = await octokit.request(`GET /orgs/${input.org}/settings/billing/advanced-security`);
    core.info(JSON.stringify(billingRet));
    
    billingRet.data.repositories.forEach((repo) => {
      const repoName = repo.name.split('/')[1];
      if (reposAllowed[repoName]) {
        repo.advanced_security_committers_breakdown.forEach((committer) => {
          if (!ghasCommitters[repoName]) {
            ghasCommitters[repoName] = {};
          }
          ghasCommitters[repoName][committer.user_login] = true;
        });
      }
    });
    core.info(JSON.stringify(ghasCommitters));

  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
