import GitlabApiClient from "../api-clients/gitlab-api-client.mjs";
import { promptText, execAsync } from "../utils.mjs";

export default async (config) => {
  const remote = await execAsync("git remote get-url origin");
  const projectPath = remote.split(":")[1].replace(".git", "");
  const currentBranchName = (
    await execAsync("git branch --show-current")
  ).trim();
  const message = await execAsync("git log -1 --pretty=format:%s");
  const mrTitle = await promptText("MR Title", message.trim());
  const gitlabClient = new GitlabApiClient(config.gitlabAccessToken);

  const url = await gitlabClient.createMR(
    projectPath,
    currentBranchName,
    mrTitle,
  );

  console.log("Merge Request created successfully");
  console.log(url, "\n", mrTitle);
  return { url, mrTitle };
};
