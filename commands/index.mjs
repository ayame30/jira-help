import selectJiraIssue from "./select-jira-issue.mjs";
import createBranch from "./create-branch.mjs";
import createMergeRequest from "./create-merge-request.mjs";
import updateJiraStatus from "./update-jira-status.mjs";
import { confirm } from "../utils.mjs";
import createCommit from "./create-commit.mjs";

export default async (config) => {
  const selectedIssue = await selectJiraIssue(config);

  if (await confirm("Checkout to new branch?")) {
    await createBranch(selectedIssue, config);
  }

  if (await confirm("Checkout to commit?")) {
    await createCommit(selectedIssue, config);
  }

  if (await confirm("Create MR?")) {
    await createMergeRequest(config);
  }

  if (await confirm("Update ticket status")) {
    await updateJiraStatus(selectedIssue, config);
  }
};
