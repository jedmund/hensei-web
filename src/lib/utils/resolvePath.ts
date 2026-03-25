import { resolve } from '$app/paths'

/**
 * Type-safe wrapper around SvelteKit's `resolve()` that accepts plain strings.
 *
 * SvelteKit 2.26+ made `resolve()` type-safe, requiring known route IDs.
 * This wrapper allows dynamic strings (e.g. from `localizeHref()`) to be
 * passed without type errors.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resolvePath = resolve as (...args: [route: string, ...rest: any[]]) => string
