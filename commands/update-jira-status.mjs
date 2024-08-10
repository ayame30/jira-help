import prompts from 'prompts';
import JiraApiClient from '../api-clients/jira-api-client.mjs';
import _ from 'lodash';
import { getTicketTitle } from '../utils.mjs';

export default async (issue, config) => {
  const jiraApiClient = new JiraApiClient(config.atlassianDomain, config.username, config.apiToken);

  const transitions = await jiraApiClient.transitions(issue.key);

  const { transitionId } = await prompts([{ type: 'select', name: 'transitionId', message: `Transit to`, choices: [
    { title: 'Unchanged', value: 'unchanged' },
    ...transitions
      .filter((transition) => transition.name !== issue.status)
      .map((transition) => ({
        title: transition.name,
        value: transition.id,
      })),
  ]}], { onCancel: () => process.exit(0) });

  if (transitionId !== 'unchanged') {
    await jiraApiClient.updateStatus(issue.key, transitionId)
    const newIssue = await jiraApiClient.ticket(issue.key);

    console.log(getTicketTitle(newIssue));
  } else {
    console.log('Unchanged');
  }
};
