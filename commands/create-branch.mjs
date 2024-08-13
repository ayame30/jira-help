import { promptText, execAsync } from "../utils.mjs";
import prompts from "prompts";

export default async (selectedIssue, _config) => {
  const ticketNumber = selectedIssue.key;
  const cleanedString = selectedIssue.summary
    .replace(/\[.*?\]/g, "")
    .trim()
    .replace(/[^\w\s]/g, "-")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-");
  const branchDesc = cleanedString.toLowerCase();

  const { type } = await prompts(
    [
      {
        type: "select",
        name: "type",
        message: "Branch type",
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
  const branchName = await promptText(
    `Branch Name - ${type}/${ticketNumber}/`,
    branchDesc,
  );
  await execAsync(`git checkout -b ${type}/${ticketNumber}/${branchName}`);

  return { type, branchName };
};
