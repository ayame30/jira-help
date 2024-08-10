import { promptText, execAsync } from "../utils.mjs";
import prompts from "prompts";

function issueToCommitName(type, issue) {
  const ticketNumber = issue.key;
  const cleanedString = issue.summary.replace(/\[.*?\]/g, "").trim();

  return `[${ticketNumber}] ${type}: ${cleanedString}`;
}

export default async (selectedIssue, _config) => {
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
  const commitName = await promptText(
    "Commit",
    issueToCommitName(type, selectedIssue),
  );
  await execAsync("git add .");
  await execAsync(`git commit -m "${commitName}"`);

  return { type, commitName };
};
