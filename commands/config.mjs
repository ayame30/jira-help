import fs from 'fs';
import prompts from 'prompts';
import chalk from 'chalk';
import { displayConfig } from '../utils.mjs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import JiraApiClient from '../api-clients/jira-api-client.mjs';


const projectChoices = [
  { title: 'No Prefix', value: '' },
  { title: '[Content] ', value: '[Content] ' },
  { title: '[Distribution] ', value: '[Distribution] ' },
  { title: '[Video] ', value: '[Video] ' },
  { title: '[ArticleAnalysis] ', value: '[ArticleAnalysis] ' },
  { title: '[Interaction] ', value: '[Interaction] ' },
  { title: '[Aggregation] ', value: '[Aggregation] ' },
  { title: '[Feed] ', value: '[Feed] ' },
  { title: '[Algolia] ', value: '[Algolia] ' },
  { title: '[Preference] ', value: '[Preference] ' },
  { title: '[Push] ', value: '[Push] ' },
  { title: '[Subscription] ', value: '[Subscription] ' },
  { title: '[Federation] ', value: '[Federation] ' },
  { title: '[DeviceAuth] ', value: '[DeviceAuth] ' },
  { title: '[Crawler] ', value: '[Crawler] ' },
  { title: '[Media] ', value: '[Media] ' },
  { title: '[Gateway] ', value: '[Gateway] ' },
  { title: '[Newspresso] ', value: '[Newspresso] ' },
];

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configDir = join(__dirname, '../.config');
const configFilePath = join(configDir, 'config.json');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

export function saveConfig(config) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

export function loadConfig() {
  if (fs.existsSync(configFilePath)) {
    const config = fs.readFileSync(configFilePath, 'utf-8');
    return JSON.parse(config);
  }
  console.error('Please setup config first');
  process.exit(1);
  return null;
}

export default async () => {
  let configJson = null;

  if (fs.existsSync(configFilePath)) {
    const config = fs.readFileSync(configFilePath, 'utf-8');
    configJson = JSON.parse(config);
  }

  const answers = await prompts([
    {
      type: 'text',
      name: 'atlassianDomain',
      message: 'Enter your Jira atlassian domain:',
      initial: configJson?.atlassianDomain || 'https://nowwwhat.atlassian.net',
    },
    {
      type: 'text',
      name: 'username',
      message: 'Enter your Jira login username / email:',
      initial: configJson?.username || 'jeo@apoidea.ai',

    },
    {
      type: 'text',
      name: 'apiToken',
      message: 'Enter your Jira API token (https://id.atlassian.com/manage-profile/security/api-tokens):',
      initial: configJson?.apiToken,
    },
  ], { onCancel: () => process.exit(0) });

  const jiraApiClient = new JiraApiClient(answers.atlassianDomain, answers.username, answers.apiToken);
  const [ projects, jiraAccountId ] = await Promise.all([
    jiraApiClient.projects(),
    jiraApiClient.jiraAccountId(),
  ]);

  const { jiraProject } = await prompts([
    { type: 'select', name: 'jiraProject', message: 'Jira Project', choices: projects.map((p) => ({
      title: `${p.key} - ${p.name}`,
      value: p.key,
    })) }
  ], { onCancel: () => process.exit(0) });
  const statuses = await jiraApiClient.statuses(jiraProject);
  const boards = await jiraApiClient.boards(jiraProject);

  const { jiraBoardId, jiraTicketPrefix, gitlabAccessToken } = await prompts([
    { type: 'select', name: 'jiraBoardId', message: 'Jira Board', choices: boards.map((p) => ({
      title: p.name,
      value: p.id,
    })) },
    {
      type: 'text',
      name: 'jiraTicketPrefix',
      message: `Ticket Prefix? \n e.g. ${jiraProject}-1819 ${chalk.bgGreen('[BE] ')}user input\n`,
      initial: configJson?.jiraTicketPrefix,
    },
    {
      type: 'text',
      name: 'gitlabAccessToken',
      message: 'Gitlab Access Token (https://gitlab.com/-/user_settings/personal_access_tokens):',
      initial: configJson?.gitlabAccessToken,
    }
  ], { onCancel: () => process.exit(0) });

  saveConfig({
    ...answers,
    jiraProject,
    jiraBoardId,
    jiraTicketPrefix: jiraTicketPrefix || '',
    jiraAccountId,
    gitlabAccessToken,
    projectChoices,
    statuses,
  });

  console.log(chalk.cyan('\nYour current Jira configuration:'));
  displayConfig(loadConfig());
};
