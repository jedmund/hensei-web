import { afterEach, describe, expect, it, vi } from 'vitest'
import type { RequestEvent } from '@sveltejs/kit'
import { logServerError } from '../logServerError'

const event = {} as RequestEvent

function run(error: unknown, status: number) {
	return logServerError({ error, event, status, message: 'Internal Error' })
}

describe('logServerError', () => {
	afterEach(() => vi.restoreAllMocks())

	it('does not log 4xx errors such as bot 404s', () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {})
		run(new Error('Not found: /.git/config'), 404)
		run(new Error('POST method not allowed'), 405)
		expect(log).not.toHaveBeenCalled()
	})

	it('logs the stack of a server error and its causes', () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {})
		const cause = new Error('db down')
		run(new Error('load failed', { cause }), 500)
		expect(log).toHaveBeenCalledTimes(2)
		expect(log.mock.calls[0]?.[0]).toContain('load failed')
		expect(log.mock.calls[1]?.[0]).toContain('db down')
	})

	it('logs a thrown non-Error value', () => {
		const log = vi.spyOn(console, 'error').mockImplementation(() => {})
		run('boom', 500)
		expect(log).toHaveBeenCalledWith('boom')
	})
})
