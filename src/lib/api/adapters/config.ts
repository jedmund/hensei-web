/**
 * Configuration for API adapters
 */
import { PUBLIC_SIERO_API_URL, PUBLIC_SIERO_IMG_URL } from '$env/static/public'

/**
 * Get the base URL for API requests
 * Always use direct API URL for both server and client
 */
export function getApiBaseUrl(): string {
	const base = PUBLIC_SIERO_API_URL || 'http://localhost:3000'
	// Production uses api.granblue.team with /v1 path
	// Local dev (including preview) uses localhost with /api/v1 path
	const isDeployedApi = base.includes('granblue.team')
	const apiPath = isDeployedApi ? '/v1' : '/api/v1'
	const url = `${base}${apiPath}`
	if (import.meta.env.DEV) console.log('[API Config]', { base, apiPath, url })
	return url
}

/**
 * Get the base URL for image assets
 * Uses AWS S3/CDN URL in production when PUBLIC_SIERO_IMG_URL is set,
 * otherwise falls back to local /images directory
 */
export function getImageBaseUrl(): string {
	// If PUBLIC_SIERO_IMG_URL is set (non-empty), use it
	// Otherwise use local images (empty string means relative path)
	return PUBLIC_SIERO_IMG_URL || ''
}

/**
 * Check if we're using remote images (AWS S3/CDN)
 */
export function isUsingRemoteImages(): boolean {
	return Boolean(PUBLIC_SIERO_IMG_URL)
}

/**
 * Default configuration for all adapters
 */
export const DEFAULT_ADAPTER_CONFIG = {
	baseURL: getApiBaseUrl(),
	timeout: 30000,
	retries: 3
}