import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Agent } from 'undici'
import { describe, expect, it, vi, afterEach } from 'vitest'

// Records the options each Agent is built with, keeping the real behaviour.
const agentOptions = vi.hoisted(() => [] as Array<{ connect?: { lookup?: unknown } }>)
vi.mock('undici', async (importOriginal) => {
	const actual = await importOriginal<typeof import('undici')>()
	class RecordingAgent extends actual.Agent {
		constructor(options: ConstructorParameters<typeof actual.Agent>[0] = {}) {
			super(options)
			agentOptions.push(options as (typeof agentOptions)[number])
		}
	}
	return { ...actual, Agent: RecordingAgent }
})
import {
	BlockedUrlError,
	assertPublicHttpUrl,
	createPinnedLookup,
	fetchPublicUrl,
	isPrivateAddress
} from '../ssrfGuard'

type LookupResult = { err: NodeJS.ErrnoException | null; address: unknown; family?: number }

const runLookup = (
	lookup: ReturnType<typeof createPinnedLookup>,
	hostname: string,
	options: { all?: boolean; family?: number } = {}
) =>
	new Promise<LookupResult>((resolve) => {
		lookup(hostname, options, (err, address, family) => resolve({ err, address, family }))
	})

const resolveTo =
	(...addresses: string[]) =>
	async () =>
		addresses

describe('isPrivateAddress', () => {
	it.each([
		'127.0.0.1',
		'10.1.2.3',
		'172.16.0.1',
		'172.31.255.255',
		'192.168.1.1',
		'169.254.169.254',
		'100.64.0.1',
		'0.0.0.0',
		'224.0.0.1',
		'::1',
		'::',
		'fd12:2dd5:2f62::1',
		'fe80::1',
		'::ffff:127.0.0.1',
		'::ffff:7f00:1',
		'64:ff9b::a00:1',
		'not-an-ip'
	])('blocks %s', (ip) => {
		expect(isPrivateAddress(ip)).toBe(true)
	})

	it.each(['8.8.8.8', '172.32.0.1', '142.250.72.14', '2606:4700::1111', '::ffff:8.8.8.8'])(
		'allows %s',
		(ip) => {
			expect(isPrivateAddress(ip)).toBe(false)
		}
	)
})

describe('assertPublicHttpUrl', () => {
	it.each([
		'http://127.0.0.1/',
		'http://[::1]/',
		'http://[::ffff:127.0.0.1]/',
		'http://169.254.169.254/latest/meta-data',
		'http://10.0.0.5/',
		'http://2130706433/',
		'http://localhost/',
		'http://api.railway.internal/',
		'http://printer.local/',
		'ftp://example.com/',
		'http://example.com:8080/',
		'http://user:pass@example.com/'
	])('rejects %s', async (url) => {
		await expect(assertPublicHttpUrl(url, resolveTo('93.184.216.34'))).rejects.toBeInstanceOf(
			BlockedUrlError
		)
	})

	it('rejects hostnames that resolve to private addresses', async () => {
		await expect(
			assertPublicHttpUrl('https://evil.example/', resolveTo('93.184.216.34', '10.0.0.1'))
		).rejects.toBeInstanceOf(BlockedUrlError)
	})

	it('rejects hostnames that do not resolve', async () => {
		const fail = async () => {
			throw new Error('ENOTFOUND')
		}
		await expect(assertPublicHttpUrl('https://nope.example/', fail)).rejects.toBeInstanceOf(
			BlockedUrlError
		)
	})

	it('allows public hosts', async () => {
		const url = await assertPublicHttpUrl(
			'https://www.youtube.com/watch?v=x',
			resolveTo('142.250.72.14')
		)
		expect(url.hostname).toBe('www.youtube.com')
	})
})

describe('fetchPublicUrl', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('re-checks redirect targets', async () => {
		const fetchMock = vi.fn(
			async () =>
				new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } })
		)
		vi.stubGlobal('fetch', fetchMock)

		await expect(
			fetchPublicUrl('https://public.example/', {}, { resolve: resolveTo('93.184.216.34') })
		).rejects.toBeInstanceOf(BlockedUrlError)
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('follows public redirects up to the limit', async () => {
		const fetchMock = vi.fn(
			async () => new Response(null, { status: 301, headers: { location: '/next' } })
		)
		vi.stubGlobal('fetch', fetchMock)

		await expect(
			fetchPublicUrl(
				'https://public.example/',
				{},
				{ maxRedirects: 2, resolve: resolveTo('93.184.216.34') }
			)
		).rejects.toThrow('too many redirects')
		expect(fetchMock).toHaveBeenCalledTimes(3)
	})

	it('returns non-redirect responses', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('<title>ok</title>', { status: 200 }))
		)

		const res = await fetchPublicUrl(
			'https://public.example/',
			{},
			{ resolve: resolveTo('93.184.216.34') }
		)
		expect(res.status).toBe(200)
	})
})

describe('createPinnedLookup', () => {
	const pins = new Map([['public.example', ['93.184.216.34', '2606:2800:220:1::248']]])
	const lookup = createPinnedLookup(pins)

	it('answers with the pinned addresses in "all" mode', async () => {
		const { err, address } = await runLookup(lookup, 'public.example', { all: true })
		expect(err).toBeNull()
		expect(address).toEqual([
			{ address: '93.184.216.34', family: 4 },
			{ address: '2606:2800:220:1::248', family: 6 }
		])
	})

	it('answers with a single address and honours the requested family', async () => {
		expect(await runLookup(lookup, 'PUBLIC.example.')).toMatchObject({
			err: null,
			address: '93.184.216.34',
			family: 4
		})
		expect(await runLookup(lookup, 'public.example', { family: 6 })).toMatchObject({
			address: '2606:2800:220:1::248',
			family: 6
		})
	})

	it('refuses hostnames that were not validated', async () => {
		const { err } = await runLookup(lookup, 'other.example', { all: true })
		expect(err?.code).toBe('ENOTFOUND')
	})

	it('dials the pinned address over a real connection', async () => {
		const server = createServer((req, res) => res.end(`host=${req.headers.host}`))
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
		const { port } = server.address() as AddressInfo
		const dispatcher = new Agent({
			connect: { lookup: createPinnedLookup(new Map([['pinned.test', ['127.0.0.1']]])) }
		})

		try {
			const res = await fetch(`http://pinned.test:${port}/`, { dispatcher } as RequestInit)
			// The Host header keeps the original hostname.
			expect(await res.text()).toBe(`host=pinned.test:${port}`)

			await expect(
				fetch(`http://unpinned.test:${port}/`, { dispatcher } as RequestInit)
			).rejects.toThrow()
		} finally {
			await dispatcher.close()
			await new Promise((resolve) => server.close(resolve))
		}
	})
})

describe('fetchPublicUrl DNS pinning', () => {
	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('connects to the first validated address even if DNS later changes', async () => {
		const answers = [['93.184.216.34'], ['127.0.0.1']]
		const resolve = vi.fn(async () => answers.shift() ?? [])
		let dialed: LookupResult | undefined

		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: URL, init: RequestInit & { dispatcher?: unknown }) => {
				expect(init.dispatcher).toBeInstanceOf(Agent)
				// Stand in for the socket: run the lookup the Agent was built with.
				const lookup = agentOptions.at(-1)?.connect?.lookup as ReturnType<typeof createPinnedLookup>
				dialed = await runLookup(lookup, url.hostname, { all: true })
				return new Response('ok', { status: 200 })
			})
		)

		await fetchPublicUrl('https://rebind.example/', {}, { resolve })

		expect(resolve).toHaveBeenCalledTimes(1)
		expect(dialed).toMatchObject({ err: null, address: [{ address: '93.184.216.34', family: 4 }] })
	})

	it('pins every redirect hop on the same connection pool', async () => {
		const addresses: Record<string, string[]> = {
			'first.example': ['93.184.216.34'],
			'second.example': ['142.250.72.14']
		}
		const resolve = vi.fn(async (hostname: string) => addresses[hostname] ?? [])
		vi.stubGlobal(
			'fetch',
			vi.fn(async (url: URL) =>
				url.hostname === 'first.example'
					? new Response(null, { status: 302, headers: { location: 'https://second.example/' } })
					: new Response('ok', { status: 200 })
			)
		)

		await fetchPublicUrl('https://first.example/', {}, { resolve })

		const lookup = agentOptions.at(-1)?.connect?.lookup as ReturnType<typeof createPinnedLookup>
		expect(await runLookup(lookup, 'first.example')).toMatchObject({ address: '93.184.216.34' })
		expect(await runLookup(lookup, 'second.example')).toMatchObject({ address: '142.250.72.14' })
		expect(resolve).toHaveBeenCalledTimes(2)
	})
})
