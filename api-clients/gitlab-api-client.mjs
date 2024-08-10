import axios from 'axios';

const gitlabUrl = 'https://gitlab.com/api/v4';

export default class GitlabApiClient {
  constructor(token) {
    this.token = token;
  }

  get headers() {
    return { 'PRIVATE-TOKEN': this.token };
  }

  async projectId(repoName) {
    const projectId = await axios.get(`${gitlabUrl}/projects/${encodeURIComponent(repoName.trim())}`, {
      headers: this.headers,
    }).then(response => response.data.id);

    return projectId;
  }

  async createMR(repoName, sourceBranch, mrTitle) {
    const projectId = await this.projectId(repoName.trim());

    const url = await axios.post(`${gitlabUrl}/projects/${projectId}/merge_requests`, {
      source_branch: sourceBranch,
      target_branch: 'main',
      title: mrTitle,
      description: '',
    }, { headers: this.headers }).then(res => res.data.web_url);

    return url;
  }
}
