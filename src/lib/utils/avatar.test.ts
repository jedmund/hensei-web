import { describe, expect, it, vi } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({ getImageBaseUrl: () => '' }))

import { avatarBackground } from './avatar'

describe('avatarBackground', () => {
	it("uses the element's portrait color", () => {
		expect(avatarBackground('fire')).toBe('var(--fire-portrait-bg)')
		expect(avatarBackground('light')).toBe('var(--light-portrait-bg)')
	})

	it('leaves the background alone without a known element', () => {
		expect(avatarBackground(undefined)).toBeUndefined()
		expect(avatarBackground(null)).toBeUndefined()
		expect(avatarBackground('')).toBeUndefined()
		expect(avatarBackground('null')).toBeUndefined()
	})
})
