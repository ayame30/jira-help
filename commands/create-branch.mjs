import { promptText, execAsync } from "../utils.mjs";
import prompts from "prompts";

async function issueToBranchName(type, issue) {
  const ticketNumber = issue.key;
  const cleanedString = issue.summary
    .replace(/\[.*?\]/g, "")
    .trim()
    .replace(/[^\w\s]/g, "-")
    .replace(/\s/g, "-")
    .replace(/-+/g, "-");
  const branchDesc = cleanedString.toLowerCase();

  return `${type}/${ticketNumber}/${branchDesc}`;
}

export default async (selectedIssue, _config) => {
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
    "Branch Name",
    await issueToBranchName(type, selectedIssue),
  );
  await execAsync(`git checkout -b ${branchName}`);

  return { type, branchName };
};
