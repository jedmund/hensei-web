import { describe, expect, it } from 'vitest'
import { isExpectedError, isInjectedScriptError } from './sentry'

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

	it('drops cancelled requests that a load rethrew as an HttpError', () => {
		expect(isExpectedError({ status: 502, body: { message: 'Request was cancelled' } })).toBe(true)
		expect(isExpectedError({ status: 502, body: { message: 'The operation was aborted.' } })).toBe(
			true
		)
		expect(isExpectedError({ status: 502, body: { message: 'Bad gateway' } })).toBe(false)
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

describe('isInjectedScriptError', () => {
	const event = (...filenames: string[]) => ({
		exception: { values: [{ stacktrace: { frames: filenames.map((filename) => ({ filename })) } }] }
	})

	it('drops errors whose frames are all <anonymous> (console or extension code)', () => {
		expect(isInjectedScriptError(event('<anonymous>'))).toBe(true)
		expect(isInjectedScriptError(event('<anonymous>', '<anonymous>'))).toBe(true)
	})

	it('keeps errors with any frame from our bundle', () => {
		expect(isInjectedScriptError(event('<anonymous>', 'app:///_app/immutable/chunks/x.js'))).toBe(
			false
		)
		expect(isInjectedScriptError(event('https://granblue.team/_app/immutable/entry/app.js'))).toBe(
			false
		)
	})

	it('keeps errors without a stack trace', () => {
		expect(isInjectedScriptError({})).toBe(false)
		expect(isInjectedScriptError({ exception: { values: [{}] } })).toBe(false)
		expect(isInjectedScriptError(event())).toBe(false)
	})
})
