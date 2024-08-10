import selectJiraIssue from './select-jira-issue.mjs';
import createBranch from './create-branch.mjs';
import createMergeRequest from './create-merge-request.mjs';
import updateJiraStatus from './update-jira-status.mjs';
import { execAsync, confirm } from '../utils.mjs';


export default async (config) => {
  const selectedIssue = await selectJiraIssue(config);

  if (await confirm('Checkout to new branch?')) {
    await createBranch(selectedIssue, config);
  }

  if (await confirm('Checkout to commit?')) {
    const { commitName } = await createCommit(selectedIssue);
    await execAsync('git add .');
    await execAsync(`git commit -m "${commitName}"`);
  }

  if (await confirm('Git Push?')) {
    await execAsync('git push origin HEAD');
  }

  if (await confirm('Create MR?')) {
    await createMergeRequest(config);
  }

  if (await confirm('Update ticket status')) {
    await updateJiraStatus(selectedIssue, config);
  }

};
