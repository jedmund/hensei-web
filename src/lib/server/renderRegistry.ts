/**
 * Render-template registry.
 *
 * Public endpoints (og:image + download) never accept a raw URL from the user.
 * They take a `(template, params)` pair, look up the template here, and the
 * template tells the render service which internal SSR route to navigate to
 * and what viewport to use. This is the single chokepoint that keeps the
 * Playwright service from being weaponised into an SSRF tool.
 *
 * Add new templates as new card components ship.
 */

export type RenderTemplateId = '_health' | 'user.support-summons'
// Adding a new id without adding the matching entry to TEMPLATES is a type
// error.

export interface RenderTemplate {
	/**
	 * Build the path of the internal SSR route that renders the card.
	 * Receives validated params and returns a relative URL (no host, no query
	 * string — the service will add the X-Render-Secret header on its own).
	 */
	internalPath: (params: Record<string, string>) => string
	/** Output viewport, in CSS pixels. Output PNG dimensions are the same. */
	viewport: { width: number; height: number }
	/** Prefix under which S3 cache objects for this template live. */
	s3Prefix: string
	/**
	 * Param keys that must be present after validation. Used to detect a
	 * caller forgetting to pass something the template depends on.
	 */
	requiredParams: readonly string[]
}

/**
 * The registry itself. Each entry is a tiny config object — no behavior beyond
 * "given these params, where does the renderer look and how big is the canvas?"
 */
export const TEMPLATES = {
	/**
	 * Internal smoke-test target. Hits a static `_render/_health` route so the
	 * Playwright singleton, S3 client, and signing layer can be exercised
	 * end-to-end without depending on any card component being shipped yet.
	 */
	_health: {
		internalPath: (params: Record<string, string>): string => {
			void params
			return '/_render/_health'
		},
		viewport: { width: 320, height: 200 },
		s3Prefix: 'previews/_health',
		requiredParams: []
	},
	/**
	 * Owner's support-summon share card. Consumed by both the download flow
	 * (auth-gated, transient gbf_name/gbf_id/team_url in the query string)
	 * and the og:image flow (no transient fields, version-stamped + cached).
	 */
	'user.support-summons': {
		internalPath: (params: Record<string, string>): string => {
			const base = `/_render/user/${encodeURIComponent(params.username ?? '')}/support-summons`
			const entries: Array<[string, string]> = []
			if (params.prefetch) entries.push(['prefetch', params.prefetch])
			if (params.gbf_name) entries.push(['gbf_name', params.gbf_name])
			if (params.gbf_id) entries.push(['gbf_id', params.gbf_id])
			if (params.team_url) entries.push(['team_url', params.team_url])
			if (entries.length === 0) return base
			return `${base}?${new URLSearchParams(entries).toString()}`
		},
		viewport: { width: 1280, height: 720 },
		s3Prefix: 'previews/user.support-summons',
		requiredParams: ['username']
	}
} as const satisfies Record<RenderTemplateId, RenderTemplate>

/**
 * Resolve a template by id. Returns null for unknown ids — callers should
 * treat unknown templates as 404 rather than 400 so we don't leak the
 * registry's exact contents.
 */
export function getTemplate(id: string): RenderTemplate | null {
	return (TEMPLATES as Record<string, RenderTemplate>)[id] ?? null
}

/**
 * S3 object key for a given template + id + version. Storage keys are derived
 * exclusively from server-validated values so an attacker can't write under
 * another user's namespace.
 */
export function s3KeyFor(template: RenderTemplate, id: string, version: string | number): string {
	return `${template.s3Prefix}/${id}/${version}.png`
}
