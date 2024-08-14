import chalk from "chalk";
import prompts from "prompts";
import { exec } from "child_process";
import _ from "lodash";

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

function getColoredSprint(sprintName, sprintLengthMin) {
  return sprintName
    ? chalk.bgGreen(` ${sprintName.padEnd(sprintLengthMin, " ")} `)
    : chalk.bgBlue(` ${"Backlog".padEnd(sprintLengthMin, " ")} `);
}

export function getColoredStatus(status, statusMinLength) {
  const str = status.padEnd(statusMinLength, " ");
  if (status === "To Do") {
    return chalk.grey(str);
  }
  if (status === "In Progress") {
    return chalk.blueBright(str);
  }
  return chalk.magenta(str);
}

function getTicketTitle(issue, allIssuesArray) {
  const keyLength = issue.key.split("-")?.[0]?.length || 0;
  const sprintLengthMin = allIssuesArray
    ? _.maxBy(allIssuesArray, (o) => o.sprintName?.length ?? 7).sprintName
        ?.length
    : 7;
  const statusMinLength = allIssuesArray
    ? _.maxBy(allIssuesArray, (o) => o.status?.length ?? 5).status?.length
    : 5;
  const summaryMinLength = allIssuesArray
    ? _.maxBy(allIssuesArray, (o) => o.summary?.length ?? 5).summary?.length
    : 5;
  const ticketMinLength = 5;

  return [
    getColoredSprint(issue.sprintName, sprintLengthMin),
    getColoredStatus(issue.status, statusMinLength),
    chalk.cyan(issue.key.padEnd(ticketMinLength + keyLength, " ")),
    issue.summary.padEnd(summaryMinLength, " "),
    issue.assignee
      ? chalk.hex(randomRGBVisibleColorHashByString(issue.assignee.accountId))(
          issue.assignee?.displayName,
        )
      : chalk.grey("(Unassigned)"),
  ].join("   ");
}

function randomRGBVisibleColorHashByString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const r = Math.abs((hash & 0xff0000) >> 16);
  const g = Math.abs((hash & 0x00ff00) >> 8);
  const b = Math.abs(hash & 0x0000ff);

  // Ensure the color is visible by adjusting brightness
  const minBrightness = 128; // Minimum brightness to ensure visibility
  const maxBrightness = 230; // Maximum brightness to avoid very light colors

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  let adjustedR = r;
  let adjustedG = g;
  let adjustedB = b;

  if (brightness < minBrightness) {
    const factor = minBrightness / brightness;
    adjustedR = Math.min(255, Math.floor(r * factor));
    adjustedG = Math.min(255, Math.floor(g * factor));
    adjustedB = Math.min(255, Math.floor(b * factor));
  } else if (brightness > maxBrightness) {
    const factor = maxBrightness / brightness;
    adjustedR = Math.floor(r * factor);
    adjustedG = Math.floor(g * factor);
    adjustedB = Math.floor(b * factor);
  }

  return `#${adjustedR.toString(16).padStart(2, "0")}${adjustedG.toString(16).padStart(2, "0")}${adjustedB.toString(16).padStart(2, "0")}`;
}

export { displayConfig, confirm, promptText, execAsync, getTicketTitle };
