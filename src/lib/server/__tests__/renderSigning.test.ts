import { describe, expect, it, vi } from 'vitest'

vi.mock('$env/dynamic/private', () => ({
	env: { RENDER_HMAC_SECRET: 'test-secret-not-for-prod' }
}))

const {
	signRenderRequest,
	verifyRenderRequest,
	appendRenderSignature,
	extractRenderSignature,
	VERSION_PARAM
} = await import('../renderSigning')

describe('renderSigning', () => {
	it('round-trips a signature with verifyRenderRequest', () => {
		const sig = signRenderRequest('user.support-summons', { username: 'alice' }, 1)
		expect(verifyRenderRequest('user.support-summons', { username: 'alice' }, 1, sig)).toBe(true)
	})

	it('canonicalizes param order so callers can pass keys in any order', () => {
		const sigA = signRenderRequest('t', { a: '1', b: '2' }, 'v')
		const sigB = signRenderRequest('t', { b: '2', a: '1' }, 'v')
		expect(sigA).toBe(sigB)
	})

	it('rejects a tampered template', () => {
		const sig = signRenderRequest('user.support-summons', { username: 'alice' }, 1)
		expect(verifyRenderRequest('user.profile', { username: 'alice' }, 1, sig)).toBe(false)
	})

	it('rejects a tampered param value', () => {
		const sig = signRenderRequest('t', { username: 'alice' }, 1)
		expect(verifyRenderRequest('t', { username: 'mallory' }, 1, sig)).toBe(false)
	})

	it('rejects a tampered version', () => {
		const sig = signRenderRequest('t', { username: 'alice' }, 1)
		expect(verifyRenderRequest('t', { username: 'alice' }, 2, sig)).toBe(false)
	})

	it('rejects an invalid-hex signature without throwing', () => {
		expect(verifyRenderRequest('t', { username: 'alice' }, 1, 'not-hex')).toBe(false)
	})

	it('rejects a length-mismatched signature', () => {
		expect(verifyRenderRequest('t', { username: 'alice' }, 1, 'abc123')).toBe(false)
	})

	it('appendRenderSignature adds both v and sig params', () => {
		const base = new URL('https://granblue.team/og/user/alice/support-summons.png')
		const signed = appendRenderSignature(base, 'user.support-summons', { username: 'alice' }, 42)
		expect(signed.searchParams.get(VERSION_PARAM)).toBe('42')
		expect(signed.searchParams.get('sig')).toMatch(/^[a-f0-9]{64}$/)
	})

	it('extractRenderSignature returns both fields when present', () => {
		const params = new URLSearchParams('v=10&sig=abc123')
		expect(extractRenderSignature(params)).toEqual({ version: '10', signature: 'abc123' })
	})

	it('extractRenderSignature returns nulls when missing', () => {
		const params = new URLSearchParams('foo=bar')
		expect(extractRenderSignature(params)).toEqual({ version: null, signature: null })
	})

	it('does not collide when a value contains canonical separators (&, =, |)', () => {
		// Without per-component encoding, `{a:'x&b=y'}` and `{a:'x', b:'y'}` would
		// both flatten to `t|a=x&b=y|v=1` and share a signature. With
		// encodeURIComponent on each key/value, the canonical strings differ.
		const sigSingle = signRenderRequest('t', { a: 'x&b=y' }, 1)
		const sigTwo = signRenderRequest('t', { a: 'x', b: 'y' }, 1)
		expect(sigSingle).not.toBe(sigTwo)

		// Pipe in a value would collide with the section separator if unencoded.
		const sigPipe = signRenderRequest('t', { a: 'x|v=99' }, 1)
		const sigForged = signRenderRequest('t', { a: 'x' }, 99)
		expect(sigPipe).not.toBe(sigForged)
	})

	it('ignores undefined/empty params in canonicalization so optional fields are stable', () => {
		const sigOmit = signRenderRequest('t', { a: '1' }, 'v')
		const sigEmpty = signRenderRequest('t', { a: '1', b: '' }, 'v')
		const sigUndef = signRenderRequest('t', { a: '1', b: undefined as unknown as string }, 'v')
		expect(sigOmit).toBe(sigEmpty)
		expect(sigOmit).toBe(sigUndef)
	})
})
