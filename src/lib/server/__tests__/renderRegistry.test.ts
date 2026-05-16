import { describe, expect, it } from 'vitest'
import { TEMPLATES, getTemplate, s3KeyFor } from '../renderRegistry'

describe('renderRegistry', () => {
	it('exposes the _health template', () => {
		expect(getTemplate('_health')).toBe(TEMPLATES._health)
	})

	it('returns null for unknown templates', () => {
		expect(getTemplate('does-not-exist')).toBeNull()
	})

	it('each template has a sane shape', () => {
		for (const [id, t] of Object.entries(TEMPLATES)) {
			expect(typeof t.internalPath, `${id}.internalPath`).toBe('function')
			expect(t.viewport.width, `${id}.viewport.width`).toBeGreaterThan(0)
			expect(t.viewport.height, `${id}.viewport.height`).toBeGreaterThan(0)
			expect(t.s3Prefix, `${id}.s3Prefix`).toMatch(/^[a-z][a-z0-9/_-]*$/)
		}
	})

	it('builds s3 keys from validated values only', () => {
		const t = TEMPLATES._health
		expect(s3KeyFor(t, 'anon', 42)).toBe('previews/_health/anon/42.png')
	})

	it('internalPath for _health is the smoke-test route', () => {
		expect(TEMPLATES._health.internalPath({})).toBe('/_render/_health')
	})
})
