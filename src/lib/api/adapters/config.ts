/**
 * Configuration for API adapters
 */
import { PUBLIC_SIERO_API_URL } from '$env/static/public'

/**
 * Get the base URL for API requests
 * Handles both server and client environments
 */
export function getApiBaseUrl(): string {
	// Use environment variable if available, otherwise default to localhost
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