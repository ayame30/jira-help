#!/usr/bin/env node

import runConfig, { loadConfig } from "./commands/config.mjs";
import selectTicket from "./commands/select-jira-issue.mjs";
import createTicket from "./commands/create-jira-issue.mjs";
import createBranch from "./commands/create-branch.mjs";
import createCommit from "./commands/create-commit.mjs";
import createMergeRequest from "./commands/create-merge-request.mjs";
import updateJiraStatus from "./commands/update-jira-status.mjs";
import index from "./commands/index.mjs";
import { Command } from "commander";
import { confirm } from "./utils.mjs";

const [, , command] = process.argv;

const mapping = {
  config: () => {
    runConfig();
  },
  ticket: async () => {
    const config = loadConfig();
    const issue = await createTicket(config);
    if (await confirm("Update ticket status")) {
      await updateJiraStatus(issue, config);
    }
  },
  branch: async () => {
    const config = loadConfig();
    const issue = await selectTicket(config);
    await createBranch(issue, config);
  },
  commit: async () => {
    const config = loadConfig();
    const issue = await selectTicket(config);
    await createCommit(issue, config);
  },
  mr: async () => {
    const config = loadConfig();
    await createMergeRequest(config);
  },
  status: async () => {
    const config = loadConfig();
    const issue = await selectTicket(config);
    await updateJiraStatus(issue, config);
  },
};

if (!command) {
  index(loadConfig());
} else if (mapping[command]) {
  mapping[command]();
} else {
  const program = new Command();
  program.command("config").description("Setup configuration");
  program.command("ticket").description("Create Jira Ticket");

  program.command("branch").description("Select ticket and create branch");

  program.command("commit").description("Select ticket and create commit");

  program.command("mr").description("Merge Request based on current branch");

  program.command("status").description("Update Jira ticket status");

  program.parse();
}
