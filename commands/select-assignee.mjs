import prompts from "prompts";
import JiraApiClient from "../api-clients/jira-api-client.mjs";
import _ from "lodash";
import chalk from "chalk";

export default async (config) => {
  let selectedAssignee;

  const jiraApiClient = new JiraApiClient(
    config.atlassianDomain,
    config.username,
    config.apiToken,
  );

  const { assignee } = await prompts(
    [
      {
        type: "select",
        name: "assignee",
        message: `Assignee`,
        choices: [
          {
            title: "Assign to me",
            value: config.jiraAccountId,
          },
          {
            title: "Keep unassigned",
            value: undefined,
          },
          {
            title: chalk.gray("...Other Assignees"),
            value: { others: true },
          },
        ],
      },
    ],
    { onCancel: () => process.exit(0) },
  );
  if (assignee.others) {
    const assignees = await jiraApiClient.assignees(config.jiraProject);
    const { otherAssignee } = await prompts(
      [
        {
          type: "select",
          name: "otherAssignee",
          message: `Other Assignee`,
          choices: [
            {
              title: "Assign to me",
              value: config.jiraAccountId,
            },
            {
              title: "Keep unassigned",
              value: undefined,
            },
            ...assignees.map((assignee) => ({
              title: `${assignee.displayName} (${assignee.emailAddress})`,
              value: assignee.accountId,
            })),
          ],
        },
      ],
      { onCancel: () => process.exit(0) },
    );
    selectedAssignee = otherAssignee;
  } else {
    selectedAssignee = assignee;
  }

  if (!selectedAssignee) {
    return undefined;
  }

  return { accountId: selectedAssignee };
};
