import prompts from "prompts";
import JiraApiClient from "../api-clients/jira-api-client.mjs";
import createJiraIssue from "./create-jira-issue.mjs";
import _ from "lodash";
import { getTicketTitle } from "../utils.mjs";

export default async (config) => {
  let selectedIssue;

  const jiraApiClient = new JiraApiClient(
    config.atlassianDomain,
    config.username,
    config.apiToken,
  );
  const issues = await jiraApiClient.tickets(config.jiraProject);

  const ticketChoices = [
    { title: "Create", value: { create: true } },
    ..._.orderBy(issues, ["sprintName", "status"], ["asc", "asc"]).map(
      (issue) => ({
        title: getTicketTitle(issue),
        value: issue,
      }),
    ),
  ];

  const { issue } = await prompts(
    [
      {
        type: "select",
        name: "issue",
        message: `Pick A Ticket`,
        choices: ticketChoices,
      },
    ],
    { onCancel: () => process.exit(0) },
  );

  if (issue.create) {
    selectedIssue = await createJiraIssue(config);
  } else {
    selectedIssue = issue;
  }

  return selectedIssue;
};
