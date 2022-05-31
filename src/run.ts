import * as core from '@actions/core';
import { load } from "js-yaml";
import { readFileSync } from "fs";
import { throttling } from '@octokit/plugin-throttling';
import { GitHub, getOctokitOptions } from '@actions/github/lib/utils'
type Octokit = InstanceType<typeof GitHub>;

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

const getRepoNames = async (octokit: Octokit, orgLogin: string): Promise<string[]> => {
  let repoNames: string[] = [];
  let _hasNextPage = true;
  let _endCursor = null;
  while (_hasNextPage) {
    const {
      organization: {
        repositories: {
          nodes: repositories,
          pageInfo: {
            hasNextPage,
            endCursor
          }
        }
      }
    } = await octokit.graphql(`{ 
      organization(login:"${orgLogin}") {
        repositories(first:100, after:${JSON.stringify(_endCursor)}) {
          nodes {
            name
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }`);
    _hasNextPage = hasNextPage;
    _endCursor = endCursor;
    const names: string[] = repositories
      .map(repo => repo.name)
      .filter(name => name !== orgLogin);
    core.info(names.join('\n'));
    repoNames = repoNames.concat(names);
  }
  return repoNames;
}

const createOctokit = (token: string): Octokit => {
  return new (GitHub.plugin(throttling))({
    ...getOctokitOptions(token),
    throttle: {
      onRateLimit: (retryAfter, options, octokit) => {
        octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`);
        if (options.request.retryCount === 0) {
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
        return false;
      },
      onSecondaryRateLimit: (_, options, octokit) => {
        octokit.log.warn(`SecondaryRateLimit detected for request ${options.method} ${options.url}`);
      },
    }
  });
}

const run = async (): Promise<void> => {
  try {
    const input = getInputs();

    const reposAllowed = {};
    const teams: {
      [key: string]: string[];
    } = load(readFileSync(input.file));
    for (const [,repos] of Object.entries(teams)) {
      repos.forEach((repo) => reposAllowed[repo] = true);
    }

    const octokit = createOctokit(input.token);
    
    const repoNames = await core.group('Get Repo Names', () => getRepoNames(octokit, input.org)
      .then((repoNames) => {
        core.setOutput('repos', JSON.stringify(repoNames));
        return repoNames;
      })
    );
    core.info(`${repoNames.length} repositories found`);

    for (const repo of repoNames) {
      const status = reposAllowed[repo] ? 'enabled' : 'disabled';
      if (input.forceEnable === false && status === 'enabled') continue;
      try {
        await octokit.request(`PATCH /repos/${input.org}/${repo}`, {
          security_and_analysis: { advanced_security: { status } }
        });
        core.info(`${input.org}/${repo}: ${status}`);
      } catch (error) {
        core.warning(error instanceof Error ? error.message : JSON.stringify(error));
      }
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : JSON.stringify(error))
  }
};

export default run;
