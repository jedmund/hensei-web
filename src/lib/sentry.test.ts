import { describe, expect, it } from 'vitest'
import { isExpectedError } from './sentry'

describe('isExpectedError', () => {
	it('drops cancelled / aborted requests', () => {
		expect(isExpectedError({ status: 0, message: 'Request was cancelled' })).toBe(true)
		expect(isExpectedError({ name: 'AbortError', message: 'aborted' })).toBe(true)
		expect(isExpectedError(new DOMException('aborted', 'AbortError'))).toBe(true)
	})

	it('drops expected HTTP client errors (4xx) from loads', () => {
		expect(isExpectedError({ status: 404, body: { message: 'not found' } })).toBe(true) // SvelteKit HttpError
		expect(isExpectedError({ status: 401 })).toBe(true)
		expect(isExpectedError({ status: 403, code: 'FORBIDDEN' })).toBe(true) // ApiError-ish
	})

	it('keeps real server errors and unexpected exceptions', () => {
		expect(isExpectedError({ status: 500 })).toBe(false)
		expect(isExpectedError({ status: 502, body: 'bad gateway' })).toBe(false)
		expect(isExpectedError(new Error('something actually broke'))).toBe(false)
		expect(isExpectedError({ message: 'plain object with no status' })).toBe(false)
	})

	it('ignores non-objects', () => {
		expect(isExpectedError(null)).toBe(false)
		expect(isExpectedError(undefined)).toBe(false)
		expect(isExpectedError('a string')).toBe(false)
		expect(isExpectedError(404)).toBe(false)
	})
})
