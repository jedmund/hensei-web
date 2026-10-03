import { beforeEach, describe, expect, it, vi } from 'vitest'

const env: Record<string, string | undefined> = {}
vi.mock('$env/dynamic/private', () => ({ env }))
vi.mock('$lib/api/adapters/config', () => ({ getApiBaseUrl: () => 'http://api.test/api/v1' }))

const renders: Array<{ path: string }> = []
let busy = false
vi.mock('$lib/server/renderService', () => {
	class RenderBusyError extends Error {}
	return {
		RenderBusyError,
		renderToImage: async (opts: { path: string }) => {
			if (busy) throw new RenderBusyError()
			renders.push(opts)
			return Buffer.from([0x89, 0x50, 0x4e, 0x47, renders.length])
		}
	}
})

const s3 = new Map<string, Buffer>()
vi.mock('$lib/server/renderCache', () => ({
	getCachedRender: async (key: string) => s3.get(key) ?? null,
	putRender: async (key: string, body: Buffer) => void s3.set(key, body)
}))

const { GET } = await import('../+server')
const gacha = await import('$lib/server/gachaShareImage')
const { consumePrefetch } = await import('$lib/server/renderPrefetch')

const ITEMS = [
	{ identity: 'Weapon:octavia', granblue_id: '1040918400', rarity: 3 },
	{ identity: 'Weapon:sr', granblue_id: '1030900000', rarity: 2 }
]

interface Call {
	url: string
	body?: Record<string, unknown>
}

function apiFetch(overrides: Record<string, () => Response> = {}) {
	const calls: Call[] = []
	const fetch = vi.fn(async (input: string, init?: RequestInit) => {
		const url = String(input)
		calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : undefined })
		const path = url.replace('http://api.test/api/v1/gacha/', '').split('?')[0] ?? ''
		const override = overrides[path]
		if (override) return override()
		if (path === 'catalogue') return Response.json({ items: ITEMS })
		return Response.json({
			draws: '300',
			seed: 'abc',
			configuration: { mode: 'premium' },
			cost: { crystals: '90000', jpy: '94500', usd: null, label: '', exchange_rate: null }
		})
	})
	return { fetch, calls }
}

let ipCounter = 0
function get(query: string, fetch = apiFetch().fetch, ip = `203.0.113.${(ipCounter += 1)}`) {
	const url = new URL(`http://localhost/download/gacha?${query}`)
	const request = new Request(url, { headers: { 'x-forwarded-for': ip } })
	return GET({ url, request, fetch } as never) as Promise<Response>
}

async function status(promise: Promise<Response>): Promise<number> {
	try {
		return (await promise).status
	} catch (err) {
		return (err as { status: number }).status
	}
}

beforeEach(() => {
	for (const key of Object.keys(env)) delete env[key]
	renders.length = 0
	busy = false
	s3.clear()
	gacha._resetImageCacheForTests()
})

describe('GET /download/gacha', () => {
	it('requires a seed, and a target for Until and Odds', async () => {
		expect(await status(get(''))).toBe(400)
		expect(await status(get('op=until&seed=abc'))).toBe(400)
	})

	it('runs the shared simulation and renders it as a PNG', async () => {
		const { fetch, calls } = apiFetch()
		const res = await get(
			'op=odds&pool=legend&target=1040918400&rateup=1040918400:0.5&rateup=1030900000:1&seed=abc&lang=ja',
			fetch
		)

		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toBe('image/png')
		const run = calls.find((call) => call.url.endsWith('/gacha/odds'))
		expect(run?.body).toMatchObject({
			mode: 'legend',
			target: 'Weapon:octavia',
			seed: 'abc',
			// Only SSRs can be rated up
			rateups: [{ identity: 'Weapon:octavia', percent: '0.5' }]
		})
		expect(renders[0]?.path).toMatch(/^\/ja\/_render\/gacha\/result\?prefetch=/)

		const token = new URL(`http://x${renders[0]?.path}`).searchParams.get('prefetch')
		expect(consumePrefetch(token)).toMatchObject({
			operation: 'odds',
			currency: 'jpy',
			target: { identity: 'Weapon:octavia' }
		})
	})

	it('serves repeat requests from the cache without re-running', async () => {
		const first = apiFetch()
		await get('seed=abc', first.fetch)
		const second = apiFetch()
		const res = await get('seed=abc&art=weapon', second.fetch)

		expect(res.status).toBe(200)
		expect(second.fetch).not.toHaveBeenCalled()
		expect(renders).toHaveLength(1)
		expect(res.headers.get('cache-control')).toContain('max-age=86400')
	})

	it('uses S3 for the cache when a bucket is configured', async () => {
		env.RENDER_S3_BUCKET = 'renders'
		await get('seed=abc')
		expect([...s3.keys()][0]).toMatch(/^previews\/gacha\.result\/[0-9a-f]{64}\/1\.png$/)
		await get('seed=abc')
		expect(renders).toHaveLength(1)
	})

	it('rate-limits unsigned cache misses per IP', async () => {
		const statuses: number[] = []
		for (let i = 0; i < 11; i++)
			statuses.push((await get(`seed=s${i}`, undefined, '198.51.100.7')).status)
		expect(statuses.slice(0, 10).every((code) => code === 200)).toBe(true)
		expect(statuses[10]).toBe(429)
		// Cached results are still served
		expect((await get('seed=s0', undefined, '198.51.100.7')).status).toBe(200)
	})

	it('accepts signed URLs from our pages and rejects tampered ones', async () => {
		env.RENDER_HMAC_SECRET = 'secret'
		const params = new URLSearchParams('seed=abc')
		params.set('lang', 'en')
		const request = gacha.parseImageRequest(params)!
		const signed = new URL(gacha.signedImageUrl('http://localhost', request))

		expect((await get(signed.search.slice(1))).status).toBe(200)

		signed.searchParams.set('seed', 'other')
		expect(await status(get(signed.search.slice(1)))).toBe(403)
	})

	it('skips signing when no secret is configured', () => {
		const request = gacha.parseImageRequest(new URLSearchParams('seed=abc'))!
		expect(gacha.signedImageUrl('http://localhost', request)).not.toContain('sig=')
	})

	it('waits for queued simulations, up to a limit', async () => {
		let polls = 0
		const { fetch } = apiFetch({
			simulations: () => Response.json({ token: 'a'.repeat(48), status: 'queued' }),
			[`jobs/${'a'.repeat(48)}`]: () => {
				polls += 1
				return polls < 2
					? Response.json({ status: 'queued' })
					: Response.json({
							status: 'complete',
							result: { draws: '20000', seed: 'abc', configuration: {}, cost: {} }
						})
			}
		})
		const { result } = await gacha.runShare(
			fetch as never,
			gacha.parseImageRequest(new URLSearchParams('seed=abc&draws=20000'))!.share,
			async () => {}
		)
		expect(result.draws).toBe('20000')
		expect(polls).toBe(2)
	})

	it('passes API rate limits through and answers 503 when the renderer is busy', async () => {
		const limited = apiFetch({
			simulations: () => new Response('{}', { status: 429, headers: { 'Retry-After': '30' } })
		})
		const res = await get('seed=abc', limited.fetch)
		expect(res.status).toBe(429)
		expect(res.headers.get('retry-after')).toBe('30')

		busy = true
		expect((await get('seed=def')).status).toBe(503)
	})
})
