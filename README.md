# GHAS Rollout Compliance

This GitHub [action](https://docs.github.com/en/actions) acts as a compliance mechanism for GHAS. The action will disable GHAS for all repositories not included in a list.

## Usage
Create a workflow (eg: `.github/workflows/ghas-compliance.yml`). See [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file).

You will need to [create a PAT(Personal Access Token)](https://github.com/settings/tokens/new?scopes=admin:org) that has `admin:org` access so we can read/write to the project.

Add this PAT as a secret so we can use it as input `github-token`, see [Creating encrypted secrets for a repository](https://docs.github.com/en/enterprise-cloud@latest/actions/security-guides/encrypted-secrets#creating-encrypted-secrets-for-a-repository).

Another option is to use something like [tibdex/github-app-token](https://github.com/tibdex/github-app-token) to get a token during the workflow.

### Organizations

If your project is part of an organization that has SAML enabled you must authorize the PAT, see [Authorizing a personal access token for use with SAML single sign-on](https://docs.github.com/en/enterprise-cloud@latest/authentication/authenticating-with-saml-single-sign-on/authorizing-a-personal-access-token-for-use-with-saml-single-sign-on).

### Example
```yml
name: GHAS Rollout Compliance
on:
  - cron:  '30 5,17 * * *'

jobs:
  run:
    name: Rollout Compliance
    runs-on: ubuntu-latest
    steps:
      - uses: NickLiffen/ghas-rollout-compliance-action@main
        with:
          github-token: ${{ secrets.MY_TOKEN }}
```

#### Repository File
You must have a file `repos.yml` which contains the list of repositories that are allowed to use GHAS. All repositories not in this list will have GHAS disabled.
```yml
TeamA:
  - demo-repository
TeamB:
  - demo-repository2
```

## Input Settings
Various inputs are defined in [`action.yml`](action.yml):

| Name | Description | Default |
| --- | - | - |
| github-token | Token to use to authorize. This should be a personal access token. | ${{&nbsp;github.token&nbsp;}} |
| org | The organization that owns of the project. | _the repository owner_
| file | The yaml file containing a list of repos that are allowed GHAS. | repos.yml
| force-enable | Force enable GHAS for all repos in the file. | false

## References
- []()