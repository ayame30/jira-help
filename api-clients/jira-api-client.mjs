import axios from "axios";

export default class JiraApiClient {
  constructor(atlassianDomain, username, apiToken) {
    this.atlassianDomain = atlassianDomain;
    this.username = username;
    this.apiToken = apiToken;

    this.jiraRestApiHost = `${atlassianDomain}/rest/api/3`;
    this.jiraRestAgileApiHost = `${atlassianDomain}/rest/agile/1.0`;
  }

  get headers() {
    return {
      Authorization: `Basic ${Buffer.from(`${this.username}:${this.apiToken}`).toString("base64")}`,
      Accept: "application/json",
    };
  }

  async projects() {
    const { data: projects } = await axios
      .get(`${this.jiraRestApiHost}/project`, {
        headers: this.headers,
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });

    return projects;
  }

  async statuses(projectIdOrKey) {
    const { data } = await axios.get(
      `${this.jiraRestApiHost}/project/${projectIdOrKey}/statuses`,
      {
        headers: this.headers,
      },
    );
    return data
      .filter((taskType) => !taskType.subtask)
      .map((taskType) => ({
        id: taskType.id,
        name: taskType.name,
        // statuses: taskType.statuses.map((status) => ({
        //   name: status.name,
        //   id: status.id,
        // })),
      }));
  }

  async transitions(issueIdOrKey) {
    const {
      data: { transitions },
    } = await axios.get(
      `${this.jiraRestApiHost}/issue/${issueIdOrKey}/transitions`,
      {
        headers: this.headers,
      },
    );

    return transitions.map((ts) => ({
      id: ts.id,
      name: ts.name,
    }));
  }

  async updateStatus(issueIdOrKey, transitionId) {
    const { data } = await axios.post(
      `${this.jiraRestApiHost}/issue/${issueIdOrKey}/transitions`,
      {
        transition: {
          id: transitionId,
        },
      },
      {
        headers: this.headers,
      },
    );

    return data;
  }

  async boards(projectKey) {
    const {
      data: { values: boards },
    } = await axios
      .get(`${this.jiraRestAgileApiHost}/board?projectKeyOrId=${projectKey}`, {
        headers: this.headers,
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });

    return boards;
  }

  async jiraAccountId() {
    const {
      data: [{ accountId: jiraAccountId }],
    } = await axios
      .get(`${this.jiraRestApiHost}/user/search?query=${this.username}`, {
        headers: this.headers,
      })
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });

    return jiraAccountId;
  }

  async tickets(projectKey) {
    const JIRA_QUERY = `project = ${projectKey} AND assignee=currentuser() AND resolution=Unresolved AND status!=Closed`;

    try {
      const response = await axios.get(
        `${this.jiraRestApiHost}/search?jql=${JIRA_QUERY}`,
        {
          headers: this.headers,
        },
      );

      return response.data.issues.map((issue) => ({
        status: issue.fields.status.name,
        key: issue.key,
        summary: issue.fields.summary,
        issueType: issue.fields.issuetype.name,
        sprintName:
          issue.fields?.customfield_10010?.length &&
          issue.fields.customfield_10010[
            issue.fields.customfield_10010.length - 1
          ]?.name,
      }));
    } catch (error) {
      console.log(error.response);
      process.exit(1);
    }
  }

  async ticket(issueIdOrKey) {
    const { data: issue } = await axios.get(
      `${this.jiraRestApiHost}/issue/${issueIdOrKey}`,
      {
        headers: this.headers,
      },
    );

    return {
      status: issue.fields.status.name,
      key: issue.key,
      summary: issue.fields.summary,
      issueType: issue.fields.issuetype.name,
      sprintName:
        issue.fields?.customfield_10010?.length &&
        issue.fields.customfield_10010[
          issue.fields.customfield_10010.length - 1
        ]?.name,
    };
  }

  async createTicket(data) {
    try {
      const { data: response } = await axios.post(
        `${this.jiraRestApiHost}/issue`,
        data,
        {
          headers: this.headers,
        },
      );

      return {
        ...response,
        summary: data.fields.summary,
        issueType: data.fields.issuetype.name,
      };
    } catch (error) {
      console.log(error.response.data);
      throw new Error(`Failed to create Jira issue: ${error.message}`);
    }
  }

  async currentSprint(boardId) {
    const {
      data: {
        values: [sprint],
      },
    } = await axios.get(
      `${this.jiraRestAgileApiHost}/board/${boardId}/sprint?state=active`,
      {
        headers: this.headers,
      },
    );
    return sprint;
  }
}
