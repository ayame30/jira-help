import { promptText, execAsync } from "../utils.mjs";
import prompts from "prompts";
import { AzureOpenAI } from "openai";
import chalk from "chalk";

const typeChoices = [
  { title: "feat", value: "feat" },
  { title: "fix", value: "fix" },
  { title: "update", value: "update" },
  { title: "refactor", value: "refactor" },
  { title: "test", value: "test" },
  { title: "docs", value: "docs" },
  { title: "chore", value: "chore" },
];

export default async (selectedIssue, config) => {
  const ticketNumber = selectedIssue.key;
  const cleanedString = selectedIssue.summary.replace(/\[.*?\]/g, "").trim();
  await execAsync("git status");
  await execAsync("git add .");

  if (config.azureOpenAIConfig) {
    const changes = await execAsync(
      "git --no-pager diff --staged --minimal -U3 ':!*.lock' ':!package-lock.json'",
    );

    const openai = new AzureOpenAI(config.azureOpenAIConfig);
    const changesMaxLength = config.azureOpenAIConfig.changesMaxLength || 4000;
    const response = await openai.chat.completions.create({
      model: config.azureOpenAIConfig.openaiModel || "gpt-4o-mini",
      store: true,
      messages: [
        {
          role: "system",
          content: `Suggest 5 commit message options for the following changes,
with prefix type ${typeChoices.map((type) => type.value).join(", ")},

You must output in JSON format
<Output Format>
{
  "commitMessages": [string]
}
</Output Format>

<Sample>
feat: update Readme.md
feat: add business logic
</Sample>

<Changes>
${changes.slice(0, changesMaxLength)}`,
        },
      ],
    });

    let commitMessages = [];
    let success = false;
    try {
      const parsed = JSON.parse(
        response.choices[0].message.content.replace(/```json\n|```/g, ""),
      );
      commitMessages = parsed.commitMessages;
      success = true;
    } catch (error) {
      console.error(error);
      console.log(response.choices[0].message.content);
    }
    if (success) {
      const defaultCommitMessage = `[${ticketNumber}] feat: ${cleanedString}`;
      const { selectedCommitMessage } = await prompts(
        [
          {
            type: "select",
            name: "selectedCommitMessage",
            message: "Commit message",
            choices: [
              { title: defaultCommitMessage, value: defaultCommitMessage },
              ...commitMessages.map((commitMessage) => ({
                title: `[${ticketNumber}] ${commitMessage}`,
                value: commitMessage,
              })),
              { title: chalk.gray("...Custom"), value: { create: true } },
            ],
          },
        ],
        { onCancel: () => process.exit(0) },
      );
      if (!selectedCommitMessage.create) {
        const [type, commitName] = selectedCommitMessage.split(":");
        const message = `[${ticketNumber}] ${selectedCommitMessage}`;
        await execAsync(`git commit -a -m "${message}"`);

        return { type, commitName: commitName.trim() };
      }
    }
  }

  const { type } = await prompts(
    [
      {
        type: "select",
        name: "type",
        message: "Commit type",
        choices: typeChoices,
      },
    ],
    { onCancel: () => process.exit(0) },
  );

  const commitName = await promptText(
    `Commit all changes - [${ticketNumber}] ${type}: `,
    cleanedString,
  );

  const message = `[${ticketNumber}] ${type}: ${commitName}`;

  await execAsync(`git commit -a -m "${message}"`);

  return { type, commitName: commitName.trim() };
};
