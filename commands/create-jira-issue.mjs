import prompts from "prompts";
import { confirm } from "../utils.mjs";
import JiraApiClient from "../api-clients/jira-api-client.mjs";
import selectAssignee from "./select-assignee.mjs";

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
                value: `${config.jiraTicketPrefix}${choice.value}`,
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
      summary: ticketPrefix + title,
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
    try {
      const currentSprint = await jiraApiClient.currentSprint(
        config.jiraBoardId,
      );
      data.fields.customfield_10010 = currentSprint.id;
    } catch {
      console.log("No current sprint found");
    }
  }

  data.fields.assignee = await selectAssignee(config);

  const ticket = await jiraApiClient.createTicket(data);

  ticket.summary = title;
  ticket.issueType = issueType;
  ticket.status = "To Do";
  return ticket;
};
