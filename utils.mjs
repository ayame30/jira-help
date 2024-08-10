import chalk from "chalk";
import prompts from "prompts";
import { exec } from "child_process";

function displayConfig(config) {
  if (config) {
    console.log(chalk.green("Domain:"), config.atlassianDomain);
    console.log(chalk.green("Username:"), config.username);
    console.log(
      chalk.green("API Token:"),
      config.apiToken ? "********" : "Not set",
    );
    console.log(chalk.green("Project:"), config.jiraProject);
  } else {
    console.log(chalk.red("No configuration found."));
  }
}

async function confirm(message) {
  const { confirm } = await prompts(
    [{ type: "confirm", name: "confirm", message, initial: true }],
    {
      onCancel: () => {
        process.exit(0);
      },
    },
  );
  return confirm;
}

async function promptText(message, initial) {
  const { answer } = await prompts(
    [{ type: "text", name: "answer", message, initial }],
    {
      onCancel: () => {
        process.exit(0);
      },
    },
  );
  return answer;
}

async function execAsync(cmd) {
  return new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error creating branch: ${error.message}`);
      }
      if (stderr) {
        console.error(stderr);
      }
      resolve(stdout);
    });
  });
}

const sprintLengthMin = 16;
const statusMinLength = 16;

function getColoredSprint(sprintName) {
  return sprintName
    ? chalk.bgGreen(sprintName.padEnd(sprintLengthMin, " "))
    : chalk.bgBlue("Backlog".padEnd(sprintLengthMin, " "));
}

function getColoredStatus(status) {
  if (status === "To Do") {
    return chalk.grey(status.padEnd(statusMinLength, " "));
  }
  if (status === "In Progress") {
    return chalk.blueBright(status.padEnd(statusMinLength, " "));
  }
  return chalk.magenta(status.padEnd(statusMinLength, " "));
}

function getTicketTitle(issue) {
  return `${getColoredSprint(issue.sprintName)} | ${getColoredStatus(issue.status)} | ${issue.key} ${issue.summary}`;
}

export { displayConfig, confirm, promptText, execAsync, getTicketTitle };
