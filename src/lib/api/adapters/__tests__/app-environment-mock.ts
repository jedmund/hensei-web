/**
 * Mock for SvelteKit's $app/environment module
 * Used in adapter tests to avoid SvelteKit dependency
 */

export const browser = false
export const building = false
export const dev = true
export const version = 'test'
