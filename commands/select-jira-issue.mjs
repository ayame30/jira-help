import prompts from "prompts";
import JiraApiClient from "../api-clients/jira-api-client.mjs";
import createJiraIssue from "./create-jira-issue.mjs";
import _ from "lodash";
import { getTicketTitle } from "../utils.mjs";
import chalk from "chalk";

function getChoices(issues) {
  return [
    { title: "Create", value: { create: true } },
    ..._.orderBy(
      issues,
      [
        (issue) => (issue.sprintName === undefined ? 1 : 0),
        "sprintName",
        "status",
      ],
      ["asc", "desc", "asc"],
    ).map((issue, _index, allIssuesArray) => ({
      title: getTicketTitle(issue, allIssuesArray),
      value: issue,
    })),
  ];
}

export default async (config) => {
  let selectedIssue;

  const jiraApiClient = new JiraApiClient(
    config.atlassianDomain,
    config.username,
    config.apiToken,
  );
  const issues = await jiraApiClient.tickets(config.jiraProject, {
    withClosed: false,
  });

  const { issue } = await prompts(
    [
      {
        type: "select",
        name: "issue",
        message: `Pick A Ticket`,
        choices: [
          ...getChoices(issues),
          {
            title: chalk.gray("...Other Closed Issues"),
            value: { closed: true },
          },
          {
            title: chalk.gray("...Unassigned Issues"),
            value: { unassigned: true },
          },
        ],
      },
    ],
    { onCancel: () => process.exit(0) },
  );
  selectedIssue = issue;

  if (selectedIssue.closed || selectedIssue.unassigned) {
    const closedIssues = await jiraApiClient.tickets(config.jiraProject, {
      withClosed: selectedIssue.closed,
      withUnassigned: selectedIssue.unassigned,
    });
    const { issue } = await prompts(
      [
        {
          type: "select",
          name: "issue",
          message: `Pick A Ticket`,
          choices: getChoices(closedIssues),
        },
      ],
      { onCancel: () => process.exit(0) },
    );
    selectedIssue = issue;
  }

  if (selectedIssue.create) {
    selectedIssue = await createJiraIssue(config);
  }

  return selectedIssue;
};
