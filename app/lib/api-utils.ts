import axios, { AxiosRequestConfig } from "axios";
import http from "http";
import https from "https";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Base URL from environment variable
const baseUrl = process.env.NEXT_PUBLIC_SIERO_API_URL || 'https://localhost:3000/v1';
const oauthUrl = process.env.NEXT_PUBLIC_SIERO_OAUTH_URL || 'https://localhost:3000/oauth';

// Shared Axios instance with sane defaults for server-side calls
const httpClient = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
  // Keep connections alive to reduce socket churn
  httpAgent: new http.Agent({ keepAlive: true, maxSockets: 50 }),
  httpsAgent: new https.Agent({ keepAlive: true, maxSockets: 50 }),
  // Do not throw on HTTP status by default; let callers handle
  validateStatus: () => true,
});

// Utility to get auth token from cookies on the server
export function getAuthToken() {
  const cookieStore = cookies();
  const accountCookie = cookieStore.get('account');
  
  if (accountCookie) {
    try {
      const accountData = JSON.parse(accountCookie.value);
      return accountData.token;
    } catch (e) {
      console.error('Failed to parse account cookie', e);
      return null;
    }
  }
  
  return null;
}

// Create headers with auth token
export function createHeaders() {
  const token = getAuthToken();
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// Helper for GET requests
export async function fetchFromApi(endpoint: string, config?: AxiosRequestConfig) {
  const headers = createHeaders();
  
  try {
    const response = await httpClient.get(`${endpoint}`, {
      ...config,
      headers: {
        ...headers,
        ...(config?.headers || {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`API fetch error: ${endpoint}`, error);
    throw error;
  }
}

// Helper for POST requests
export async function postToApi(endpoint: string, data: any, config?: AxiosRequestConfig) {
  const headers = createHeaders();
  
  try {
    const response = await httpClient.post(`${endpoint}`, data, {
      ...config,
      headers: {
        ...headers,
        ...(config?.headers || {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`API post error: ${endpoint}`, error);
    throw error;
  }
}

// Helper for PUT requests
export async function putToApi(endpoint: string, data: any, config?: AxiosRequestConfig) {
  const headers = createHeaders();
  
  try {
    const response = await httpClient.put(`${endpoint}`, data, {
      ...config,
      headers: {
        ...headers,
        ...(config?.headers || {})
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`API put error: ${endpoint}`, error);
    throw error;
  }
}

// Helper for DELETE requests
export async function deleteFromApi(endpoint: string, data?: any, config?: AxiosRequestConfig) {
  const headers = createHeaders();
  
  try {
    const response = await httpClient.delete(`${endpoint}`, {
      ...config,
      headers: {
        ...headers,
        ...(config?.headers || {})
      },
      data
    });
    
    return response.data;
  } catch (error) {
    console.error(`API delete error: ${endpoint}`, error);
    throw error;
  }
}

// Helper for login endpoint
export async function login(credentials: { email: string; password: string }) {
  try {
    const response = await axios.post(`${oauthUrl}/token`, credentials);
    return response.data;
  } catch (error) {
    console.error('Login error', error);
    throw error;
  }
}

// Helper to revalidate cache for a path
export function revalidate(path: string) {
  try {
    revalidatePath(path);
  } catch (error) {
    console.error(`Failed to revalidate ${path}`, error);
  }
}

// Schemas for validation
export const UserSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email(),
  password: z.string().min(8),
});

export const PartySchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  visibility: z.enum(['public', 'unlisted', 'private']),
  raid_id: z.string().optional(),
  element: z.number().optional(),
});

export const SearchSchema = z.object({
  query: z.string(),
  filters: z.record(z.array(z.number())).optional(),
  job: z.string().optional(),
  locale: z.string().default('en'),
  page: z.number().default(0),
});
