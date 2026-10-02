import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '../+server'
import { parseCspReports, summarizeViolation } from '$lib/server/cspReport'

function post(body: string, type: string, extraHeaders: Record<string, string> = {}) {
	const request = new Request('http://localhost/api/csp-report', {
		method: 'POST',
		headers: { 'content-type': type, ...extraHeaders },
		body
	})
	return POST({ request } as never) as Promise<Response>
}

const legacyReport = {
	'csp-report': {
		'document-uri': 'https://granblue.team/teams/abc?token=secret#frag',
		'effective-directive': 'img-src',
		'violated-directive': 'img-src',
		'blocked-uri': 'https://evil.example/collect?d=stolen',
		'source-file': 'https://granblue.team/_app/immutable/chunks/x.js'
	}
}

const reportingApiReport = [
	{
		type: 'csp-violation',
		body: {
			documentURL: 'https://granblue.team/teams/explore',
			effectiveDirective: 'script-src-elem',
			blockedURL: 'inline',
			sourceFile: 'https://granblue.team/teams/explore'
		}
	},
	{ type: 'deprecation', body: { id: 'x' } }
]

describe('POST /api/csp-report', () => {
	let warn: ReturnType<typeof vi.spyOn>
	beforeEach(() => {
		warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
	})
	afterEach(() => warn.mockRestore())

	it('logs a legacy report-uri report without the query string or blocked path', async () => {
		const res = await post(JSON.stringify(legacyReport), 'application/csp-report')
		expect(res.status).toBe(204)
		expect(warn).toHaveBeenCalledWith(
			'[csp] directive=img-src blocked=https://evil.example page=/teams/abc source=https://granblue.team'
		)
		expect(JSON.stringify(warn.mock.calls)).not.toContain('secret')
		expect(JSON.stringify(warn.mock.calls)).not.toContain('stolen')
	})

	it('logs Reporting API reports and skips other report types', async () => {
		const res = await post(JSON.stringify(reportingApiReport), 'application/reports+json')
		expect(res.status).toBe(204)
		expect(warn).toHaveBeenCalledTimes(1)
		expect(warn).toHaveBeenCalledWith(
			'[csp] directive=script-src-elem blocked=inline page=/teams/explore source=https://granblue.team'
		)
	})

	it('rejects other content types', async () => {
		const res = await post(JSON.stringify(legacyReport), 'text/plain')
		expect(res.status).toBe(415)
		expect(warn).not.toHaveBeenCalled()
	})

	it('rejects oversized bodies', async () => {
		const big = JSON.stringify({ 'csp-report': { 'blocked-uri': 'x'.repeat(20_000) } })
		const res = await post(big, 'application/csp-report')
		expect(res.status).toBe(413)
		expect(warn).not.toHaveBeenCalled()
	})

	it('accepts malformed JSON quietly', async () => {
		const res = await post('{not json', 'application/csp-report')
		expect(res.status).toBe(204)
		expect(warn).not.toHaveBeenCalled()
	})
})

describe('summarizeViolation', () => {
	it('only marks violations caused by browser extensions', () => {
		const [violation] = parseCspReports({
			'csp-report': {
				'effective-directive': 'script-src',
				'blocked-uri': 'chrome-extension://abcdef/inject.js',
				'document-uri': 'https://granblue.team/?q=private'
			}
		})
		expect(summarizeViolation(violation!)).toBe('[csp] extension directive=script-src')
	})

	it('ignores empty reports', () => {
		expect(summarizeViolation({ directive: '', blocked: '', page: '', source: '' })).toBeNull()
	})

	it('ignores bodies that are not reports', () => {
		expect(parseCspReports({ hello: 'world' })).toEqual([])
		expect(parseCspReports('text')).toEqual([])
		expect(parseCspReports([null, 1, { type: 'csp-violation' }])).toEqual([])
	})
})
