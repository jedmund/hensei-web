/**
 * Configuration for API adapters
 */
import { PUBLIC_SIERO_API_URL } from '$env/static/public'

/**
 * Get the base URL for API requests
 * Always use direct API URL for both server and client
 */
export function getApiBaseUrl(): string {
	// Always use direct API URL
	const base = PUBLIC_SIERO_API_URL || 'http://localhost:3000'
	return `${base}/api/v1`
}

/**
 * Default configuration for all adapters
 */
export const DEFAULT_ADAPTER_CONFIG = {
	baseURL: getApiBaseUrl(),
	timeout: 30000,
	retries: 3,
	cacheTime: 0
}