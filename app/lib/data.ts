import { unstable_cache } from 'next/cache';
import { fetchFromApi } from './api-utils';

// Cached server-side data fetching functions
// These are wrapped with React's cache function to deduplicate requests

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
  const key = [
    'getTeams',
    String(element ?? ''),
    String(raid ?? ''),
    String(recency ?? ''),
    String(page ?? 1),
    String(username ?? ''),
  ];

  const run = unstable_cache(async () => {
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
  }, key, { revalidate: 60 });

  return run();
}

// Get a single team by shortcode
export async function getTeam(shortcode: string) {
  const key = ['getTeam', String(shortcode)];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi(`/parties/${shortcode}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch team with shortcode ${shortcode}`, error);
      throw error;
    }
  }, key, { revalidate: 60 });
  return run();
}

// Get user info
export async function getUserInfo(username: string) {
  const key = ['getUserInfo', String(username)];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi(`/users/info/${username}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch user info for ${username}`, error);
      throw error;
    }
  }, key, { revalidate: 60 });
  return run();
}

// Get raid groups
export async function getRaidGroups() {
  const key = ['getRaidGroups'];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi('/raids/groups');
      return data;
    } catch (error) {
      console.error('Failed to fetch raid groups', error);
      throw error;
    }
  }, key, { revalidate: 300 });
  return run();
}

// Get version info
export async function getVersion() {
  const key = ['getVersion'];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi('/version');
      return data;
    } catch (error) {
      console.error('Failed to fetch version info', error);
      throw error;
    }
  }, key, { revalidate: 300 });
  return run();
}

// Get user's favorites/saved teams
export async function getFavorites() {
  const key = ['getFavorites'];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi('/parties/favorites');
      return data;
    } catch (error) {
      console.error('Failed to fetch favorites', error);
      throw error;
    }
  }, key, { revalidate: 60 });
  return run();
}

// Get all jobs
export async function getJobs(element?: number) {
  const key = ['getJobs', String(element ?? '')];
  const run = unstable_cache(async () => {
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
  }, key, { revalidate: 300 });
  return run();
}

// Get job by ID
export async function getJob(jobId: string) {
  const key = ['getJob', String(jobId)];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi(`/jobs/${jobId}`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch job with ID ${jobId}`, error);
      throw error;
    }
  }, key, { revalidate: 300 });
  return run();
}

// Get job skills
export async function getJobSkills(jobId?: string) {
  const key = ['getJobSkills', String(jobId ?? '')];
  const run = unstable_cache(async () => {
    try {
      const endpoint = jobId ? `/jobs/${jobId}/skills` : '/jobs/skills';
      const data = await fetchFromApi(endpoint);
      return data;
    } catch (error) {
      console.error('Failed to fetch job skills', error);
      throw error;
    }
  }, key, { revalidate: 300 });
  return run();
}

// Get job accessories
export async function getJobAccessories(jobId: string) {
  const key = ['getJobAccessories', String(jobId)];
  const run = unstable_cache(async () => {
    try {
      const data = await fetchFromApi(`/jobs/${jobId}/accessories`);
      return data;
    } catch (error) {
      console.error(`Failed to fetch accessories for job ${jobId}`, error);
      throw error;
    }
  }, key, { revalidate: 300 });
  return run();
}
