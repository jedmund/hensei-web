import { fetchFromApi } from './api-utils';

// Server-side data fetching functions
// Next.js automatically deduplicates requests within the same render

// Get teams with optional filters
export async function getTeams({
  element,
  raid,
  recency,
  page = 1,
  username,
}: {
  element?: number;
  raid?: string;
  recency?: string;
  page?: number;
  username?: string;
}) {
  const queryParams: Record<string, string> = {};
  if (element) queryParams.element = element.toString();
  if (raid) queryParams.raid_id = raid;
  if (recency) queryParams.recency = recency;
  if (page) queryParams.page = page.toString();

  let endpoint = '/parties';
  if (username) {
    endpoint = `/users/${username}/parties`;
  }

  const queryString = new URLSearchParams(queryParams).toString();
  if (queryString) endpoint += `?${queryString}`;

  try {
    const data = await fetchFromApi(endpoint);
    return data;
  } catch (error) {
    console.error('Failed to fetch teams', error);
    throw error;
  }
}

// Get a single team by shortcode
export async function getTeam(shortcode: string) {
  try {
    const data = await fetchFromApi(`/parties/${shortcode}`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch team with shortcode ${shortcode}`, error);
    throw error;
  }
}

// Get user info
export async function getUserInfo(username: string) {
  try {
    const data = await fetchFromApi(`/users/info/${username}`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch user info for ${username}`, error);
    throw error;
  }
}

// Get user profile with teams (combines user info and teams)
export async function getUserProfile(username: string, params?: {
  element?: number;
  raid?: string;
  recency?: string;
  page?: number;
}) {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.element) queryParams.element = params.element.toString();
    if (params?.raid) queryParams.raid_id = params.raid;
    if (params?.recency) queryParams.recency = params.recency;
    if (params?.page) queryParams.page = params.page.toString();

    let endpoint = `/users/${username}`;
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) endpoint += `?${queryString}`;

    const data = await fetchFromApi(endpoint);
    return data;
  } catch (error) {
    console.error(`Failed to fetch user profile for ${username}`, error);
    throw error;
  }
}

// Get raid groups
export async function getRaidGroups() {
  try {
    const data = await fetchFromApi('/raids/groups');
    return data;
  } catch (error) {
    console.error('Failed to fetch raid groups', error);
    throw error;
  }
}

// Get version info
export async function getVersion() {
  try {
    const data = await fetchFromApi('/version');
    return data;
  } catch (error) {
    console.error('Failed to fetch version info', error);
    throw error;
  }
}

// Get user's favorites/saved teams
export async function getFavorites() {
  try {
    const data = await fetchFromApi('/parties/favorites');
    return data;
  } catch (error) {
    console.error('Failed to fetch favorites', error);
    throw error;
  }
}

// Get all jobs
export async function getJobs(element?: number) {
  try {
    const queryParams: Record<string, string> = {};
    if (element) queryParams.element = element.toString();

    let endpoint = '/jobs';
    const queryString = new URLSearchParams(queryParams).toString();
    if (queryString) endpoint += `?${queryString}`;

    const data = await fetchFromApi(endpoint);
    return data;
  } catch (error) {
    console.error('Failed to fetch jobs', error);
    throw error;
  }
}

// Get job by ID
export async function getJob(jobId: string) {
  try {
    const data = await fetchFromApi(`/jobs/${jobId}`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch job with ID ${jobId}`, error);
    throw error;
  }
}

// Get job skills
export async function getJobSkills(jobId?: string) {
  try {
    const endpoint = jobId ? `/jobs/${jobId}/skills` : '/jobs/skills';
    const data = await fetchFromApi(endpoint);
    return data;
  } catch (error) {
    console.error('Failed to fetch job skills', error);
    throw error;
  }
}

// Get job accessories
export async function getJobAccessories(jobId: string) {
  try {
    const data = await fetchFromApi(`/jobs/${jobId}/accessories`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch accessories for job ${jobId}`, error);
    throw error;
  }
}