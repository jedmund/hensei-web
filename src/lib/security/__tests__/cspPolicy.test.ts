import { createHash } from 'node:crypto'
import { compile } from 'svelte/compiler'
import { describe, expect, it } from 'vitest'
import {
	buildCspDirectives,
	cspConfig,
	CSP_REPORT_PATH,
	parseCspMode,
	SVELTE_EVENT_REPLAY_HANDLER
} from '../cspPolicy.js'

const env = {
	apiUrl: 'https://api.granblue.team/v1',
	imgUrl: 'https://siero-img.s3-us-west-2.amazonaws.com',
	sentryDsn: 'https://abc123secretkey@o56589.ingest.us.sentry.io/4511620242538496'
}

describe('buildCspDirectives', () => {
	const directives = buildCspDirectives(env)

	it('derives environment hosts from the env vars', () => {
		expect(directives['connect-src']).toContain('https://api.granblue.team')
		expect(directives['connect-src']).toContain('https://o56589.ingest.us.sentry.io')
		expect(directives['img-src']).toContain('https://siero-img.s3-us-west-2.amazonaws.com')
		expect(directives['font-src']).toContain('https://siero-img.s3-us-west-2.amazonaws.com')
		// KaTeX fonts that Vite inlines as data: URLs
		expect(directives['font-src']).toContain('data:')
	})

	it('never includes the Sentry key', () => {
		expect(JSON.stringify(directives)).not.toContain('abc123secretkey')
	})

	it('allows inline code only for styles, and never eval or wildcards for scripts', () => {
		for (const [name, sources] of Object.entries(directives)) {
			if (name !== 'style-src') expect(sources).not.toContain('unsafe-inline')
			expect(sources).not.toContain('unsafe-eval')
		}
		expect(directives['script-src']).toEqual(['self', 'unsafe-hashes', expect.any(String)])
	})

	it("allows only Svelte's event-replay handler as an inline attribute", () => {
		// What Svelte's server renderer emits for an <img> with an error handler.
		// If a Svelte upgrade changes it, update SVELTE_EVENT_REPLAY_HANDLER and
		// the hash in cspPolicy.js.
		const { js } = compile('<img src="a.png" alt="" onerror={() => {}} />', {
			generate: 'server'
		})
		expect(js.code).toContain(`onerror="${SVELTE_EVENT_REPLAY_HANDLER}"`)

		const hash = createHash('sha256').update(SVELTE_EVENT_REPLAY_HANDLER).digest('base64')
		expect(directives['script-src']).toContain(`sha256-${hash}`)
	})

	it('allows media from the image bucket', () => {
		expect(directives['media-src']).toEqual([
			'self',
			'https://siero-img.s3-us-west-2.amazonaws.com'
		])
	})

	it('lets video embeds come only from the privacy-enhanced YouTube host', () => {
		expect(directives['frame-src']).toEqual(['https://www.youtube-nocookie.com'])
		expect(JSON.stringify(directives)).not.toContain('https://www.youtube.com')
	})

	it('blocks framing, plugins and base or form hijacking', () => {
		expect(directives['frame-ancestors']).toEqual(['none'])
		expect(directives['object-src']).toEqual(['none'])
		expect(directives['base-uri']).toEqual(['self'])
		expect(directives['form-action']).toEqual(['self'])
	})

	it('drops missing or invalid hosts instead of emitting them', () => {
		const bare = buildCspDirectives({ apiUrl: undefined, imgUrl: 'not a url', sentryDsn: '' })
		expect(bare['connect-src']).toEqual(['self', 'https://gbf.wiki'])
		expect(JSON.stringify(bare)).not.toContain('not a url')
	})
})

describe('parseCspMode', () => {
	it('accepts known modes and falls back otherwise', () => {
		expect(parseCspMode('enforce', 'off')).toBe('enforce')
		expect(parseCspMode('report-only', 'off')).toBe('report-only')
		expect(parseCspMode('bogus', 'report-only')).toBe('report-only')
		expect(parseCspMode(undefined, 'off')).toBe('off')
	})
})

describe('cspConfig', () => {
	const directives = buildCspDirectives(env)

	it('sends no policy when off', () => {
		expect(cspConfig('off', directives)).toEqual({ mode: 'auto' })
	})

	it('reports without blocking in report-only mode', () => {
		const config = cspConfig('report-only', directives)
		expect(config.directives).toBeUndefined()
		expect(config.reportOnly?.['report-uri']).toEqual([CSP_REPORT_PATH])
	})

	it('blocks and keeps reporting when enforced', () => {
		const config = cspConfig('enforce', directives)
		expect(config.directives).toEqual(directives)
		expect(config.reportOnly?.['report-uri']).toEqual([CSP_REPORT_PATH])
	})
})
