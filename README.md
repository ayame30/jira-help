### Install

```
npm install https://github.com/ayame30/jira-help
```

### Usage

```

Usage: jira-help [options] [command]

Options:
  -h, --help      display help for command

Commands:
  config          Setup configuration
  ticket          Create Jira Ticket
  branch          Select ticket and create branch
  commit          Select ticket and create commit
  mr              Merge Request based on current branch
  status          Update Jira ticket status
  help [command]  display help for command
```

### Configuration

Configuration can be stored in multiple locations:

1. Global configuration file: `~/.config/jira-help/config.json
2. Project-specific configuration file: `.jira-help.json` in the project root
3. VSCode workspace settings: `.vscode/settings.json` with `jiraHelp` property


### Example
```dotnetcli

$ jira-help

✔ Pick A Ticket › Create
✔ Issue Type › Task
✔ Ticket Prefix › [BE] [Crawler] 
✔ Title ? [BE] [Crawler]  … Update readme
✔ Description … 
✔ Add to CurrentSprint? … yes
✔ Assign to yourself? … yes
✔ Checkout to new branch? … yes
✔ Branch type › feat
✔ Branch Name - feat/TICKET-3685/ … update-readme
Switched to a new branch 'feat/TICKET-3685/update-readme'

✔ Checkout to commit? … yes
✔ Commit type › feat
✔ Commit all changes - [TICKET-3685] feat:  … Update readme
✔ Git Push? … yes
✔ Create MR? … yes
✔ MR Title … [TICKET-3685] feat: Update readme
Merge Request created successfully
https://gitlab.com/.../-/merge_requests/34 
 [TICKET-3685] feat: Update readme

✔ Update ticket status … yes
✔ Transit to › Ready for Code review
TICKET Sprint 36  | Ready for Code review | TICKET-3685 [BE] [Crawler] Update readme

```
