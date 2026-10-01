import { describe, expect, it, vi, afterEach } from 'vitest'
import {
	BlockedUrlError,
	assertPublicHttpUrl,
	fetchPublicUrl,
	isPrivateAddress
} from '../ssrfGuard'

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
