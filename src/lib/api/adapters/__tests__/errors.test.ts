import { describe, expect, it } from 'vitest'
import { normalizeError } from '../errors'

describe('normalizeError', () => {
	it("swaps the browser's fetch failure text for a readable one", () => {
		for (const raw of ['NetworkError when attempting to fetch resource.', 'Failed to fetch']) {
			const error = normalizeError(new TypeError(raw))
			expect(error.code).toBe('NETWORK_ERROR')
			expect(error.message).toBe(
				'Unable to connect to the server. Please check your internet connection.'
			)
			expect((error.details as Error).message).toBe(raw)
		}
	})
})
