import prompts from "prompts";
import { confirm } from "../utils.mjs";
import JiraApiClient from "../api-clients/jira-api-client.mjs";

export default async (config) => {
  const jiraApiClient = new JiraApiClient(
    config.atlassianDomain,
    config.username,
    config.apiToken,
  );

  const { issueType, ticketPrefix = config.jiraTicketPrefix } = await prompts(
    [
      {
        type: "select",
        name: "issueType",
        message: "Issue Type",
        choices: config.statuses.map((taskType) => ({
          title: taskType.name,
          value: taskType.name,
        })),
      },
      ...(config.projectChoices?.length
        ? [
            {
              type: "select",
              name: "ticketPrefix",
              message: "Ticket Prefix",
              choices: config.projectChoices.map((choice) => ({
                title: `${config.jiraTicketPrefix}${choice.title}`,
                value: `${config.jiraTicketPrefix}${choice.title}`,
              })),
            },
          ]
        : []),
    ],
    { onCancel: () => process.exit(0) },
  );
  const { title, description } = await prompts(
    [
      { type: "text", name: "title", message: `Title ? ${ticketPrefix}` },
      { type: "text", name: "description", message: "Description" },
    ],
    { onCancel: () => process.exit(0) },
  );

  const data = {
    fields: {
      project: {
        key: config.jiraProject,
      },
      summary: title,
      description: {
        content: [
          {
            content: [
              {
                text: description || "",
                type: "text",
              },
            ],
            type: "paragraph",
          },
        ],
        type: "doc",
        version: 1,
      },
      issuetype: { name: issueType },
    },
  };

  if (await confirm("Add to CurrentSprint?")) {
    const currentSprint = await jiraApiClient.currentSprint(config.jiraBoardId);
    data.fields.customfield_10010 = currentSprint.id;
  }

  if (await confirm("Assign to yourself?")) {
    data.fields.assignee = { accountId: config.accountId };
  }

  const ticket = await jiraApiClient.createTicket(data);

  ticket.summary = title;
  ticket.issueType = issueType;
  ticket.status = "To Do";
  return ticket;
};
