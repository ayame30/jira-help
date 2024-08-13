import { promptText, execAsync } from "../utils.mjs";
import prompts from "prompts";

export default async (selectedIssue, _config) => {
  const ticketNumber = selectedIssue.key;
  const cleanedString = selectedIssue.summary.replace(/\[.*?\]/g, "").trim();

  const { type } = await prompts(
    [
      {
        type: "select",
        name: "type",
        message: "Commit type",
        choices: [
          { title: "feat", value: "feat" },
          { title: "fix", value: "fix" },
          { title: "update", value: "update" },
          { title: "refactor", value: "refactor" },
          { title: "test", value: "test" },
          { title: "docs", value: "docs" },
          { title: "chore", value: "chore" },
        ],
      },
    ],
    { onCancel: () => process.exit(0) },
  );
  await execAsync("git status");
  const commitName = await promptText(
    `Commit all changes - [${ticketNumber}] ${type}: `,
    cleanedString,
  );
  await execAsync("git add .");
  await execAsync(
    `git commit -a -m "[${ticketNumber}] ${type}: ${commitName}"`,
  );

  return { type, commitName };
};
