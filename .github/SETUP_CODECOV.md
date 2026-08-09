# Setup Codecov and Branch Protection

Follow these steps to enable automatic coverage publishing and require the CI check on protected branches.

1. Repository secret (private repos only)
   - Go to the repository Settings → Secrets → Actions.
   - Add a secret named `CODECOV_TOKEN` with the token from your Codecov project (skip for public repos if Codecov allows uploads without a token).

2. Verify the workflow produces `coverage/lcov.info`
   - The monitor workflow runs `npm run coverage` and uploads the `coverage` artifact.
   - After a successful run, confirm `coverage/lcov.info` exists in the artifact or the `coverage/` folder in the runner.

3. Enable branch protection and require the check
   - Go to Settings → Branches → Branch protection rules → Add rule (or edit `main`).
   - Under "Protect matching branches", enable "Require status checks to pass before merging".
   - Wait for a run of the `Cloud Monitor` workflow on `main` so the check appears in the list. Then select the `Cloud Monitor` check (it may appear as the workflow name) and save the rule.

   5. Automated helper to enable protection (optional)
       - This repository includes a manual workflow `.github/workflows/configure-branch-protection.yml` which will call the GitHub API to add a branch protection rule requiring the `Cloud Monitor` status check.
       - To run it:
          1. Create a repository secret named `ADMIN_GITHUB_TOKEN` containing a personal access token (PAT) with `repo` scope (for private repos) and `admin:repo_hook` or equivalent admin permissions.
          2. In the Actions tab, select the `Configure Branch Protection` workflow and click "Run workflow". Choose the branch (default `main`) and the required status check name (default `Cloud Monitor`).
       - The workflow will call the GitHub API to apply the rule. If you prefer, you can configure branch protection manually in the GitHub UI instead.

4. Verify
   - Push a change to a branch and open a PR. The `Cloud Monitor` workflow should run and Codecov will receive the `lcov` report, updating the badge.
