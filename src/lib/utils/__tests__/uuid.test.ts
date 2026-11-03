import { afterEach, describe, expect, it } from 'vitest'
import { uuid } from '../uuid'

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('uuid', () => {
	const original = Object.getOwnPropertyDescriptor(crypto, 'randomUUID')
	afterEach(() => {
		if (original) Object.defineProperty(crypto, 'randomUUID', original)
		else delete (crypto as { randomUUID?: unknown }).randomUUID
	})

	it('returns a version 4 UUID', () => {
		expect(uuid()).toMatch(V4)
	})

	it('falls back when crypto.randomUUID is missing (insecure origins)', () => {
		Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
		const ids = new Set(Array.from({ length: 50 }, () => uuid()))
		expect(ids.size).toBe(50)
		for (const id of ids) expect(id).toMatch(V4)
	})
})
