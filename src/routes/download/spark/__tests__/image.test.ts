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
const spark = await import('$lib/server/sparkImage')
const { consumePrefetch } = await import('$lib/server/renderPrefetch')

const ITEMS = [
	{ identity: 'Weapon:a', granblue_id: '1040000100', rarity: 3 },
	{ identity: 'Weapon:b', granblue_id: '1040000200', rarity: 3 },
	{ identity: 'Summon:s', granblue_id: '2040000100', rarity: 3 }
]

function apiFetch(response: () => Response = () => Response.json({ items: ITEMS })) {
	const calls: string[] = []
	const fetch = vi.fn(async (input: string) => {
		calls.push(String(input))
		return response()
	})
	return { fetch, calls }
}

let ipCounter = 0
function get(query: string, fetch = apiFetch().fetch, ip = `203.0.113.${(ipCounter += 1)}`) {
	const url = new URL(`http://localhost/download/spark?${query}`)
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
	spark.shareImage.cache.reset()
})

describe('GET /download/spark', () => {
	it('needs at least one item', async () => {
		expect(await status(get(''))).toBe(400)
		expect(await status(get('c=not-an-id'))).toBe(400)
	})

	it('resolves the spark against the whole catalogue and renders it as a PNG', async () => {
		const { fetch, calls } = apiFetch()
		// The second character isn't in the catalogue, so the mark moves with the last one
		const res = await get('c=1040000100,1040009900,1040000200&s=2040000100&spark=c2&lang=ja', fetch)

		expect(res.status).toBe(200)
		expect(res.headers.get('content-type')).toBe('image/png')
		expect(calls).toEqual(['http://api.test/api/v1/gacha/catalogue?mode=all'])
		expect(renders[0]?.path).toMatch(/^\/ja\/_render\/spark\?prefetch=/)

		const token = new URL(`http://x${renders[0]?.path}`).searchParams.get('prefetch')
		const stored = consumePrefetch<{
			spark: { columns: Record<string, { identity: string }[]>; sparked: unknown }
			theme: string
		}>(token)
		const data = stored?.spark
		expect(data?.columns.characters?.map((item) => item.identity)).toEqual(['Weapon:a', 'Weapon:b'])
		expect(data?.columns.summons?.map((item) => item.identity)).toEqual(['Summon:s'])
		expect(data?.sparked).toEqual([{ column: 'characters', index: 1 }])
		// Dark unless a theme is asked for
		expect(stored?.theme).toBe('dark')
	})

	it("marks the rate-ups of the spark's banner", async () => {
		const calls: string[] = []
		const fetch = vi.fn(async (input: string) => {
			calls.push(String(input))
			return String(input).includes('/gacha/rate_ups')
				? Response.json({ banners: [], rate_ups: ['1040000200'] })
				: Response.json({ items: ITEMS })
		})

		const res = await get('c=1040000100,1040000200&date=2026-11-17&pool=flash&lang=en', fetch)

		expect(res.status).toBe(200)
		expect(calls).toContain('http://api.test/api/v1/gacha/rate_ups?date=2026-11-17&pool=flash')
		const token = new URL(`http://x${renders.at(-1)?.path}`).searchParams.get('prefetch')
		expect(consumePrefetch<{ spark: { rateUps: string[] } }>(token)?.spark.rateUps).toEqual([
			'1040000200'
		])
	})

	it('draws in the theme it is asked for, cached apart', async () => {
		await get('c=1040000100&theme=light')
		const token = new URL(`http://x${renders[0]?.path}`).searchParams.get('prefetch')
		expect(consumePrefetch<{ theme: string }>(token)?.theme).toBe('light')
		await get('c=1040000100')
		expect(renders).toHaveLength(2)
		expect(
			spark.parseSparkImageRequest(new URLSearchParams('c=1040000100&theme=pink'))?.theme
		).toBe('dark')
	})

	it('serves repeat requests from the cache', async () => {
		await get('c=1040000100')
		const second = apiFetch()
		const res = await get('c=1040000100&unrelated=1', second.fetch)
		expect(res.status).toBe(200)
		expect(second.fetch).not.toHaveBeenCalled()
		expect(renders).toHaveLength(1)
	})

	it('uses S3 for the cache when a bucket is configured', async () => {
		env.RENDER_S3_BUCKET = 'renders'
		await get('c=1040000100')
		expect([...s3.keys()][0]).toMatch(/^previews\/spark\.image\/[0-9a-f]{64}\/3\.png$/)
	})

	it('rate-limits unsigned cache misses per IP', async () => {
		const statuses: number[] = []
		for (let i = 0; i < 11; i++)
			statuses.push((await get(`c=1040000100&draws=${i + 1}`, undefined, '198.51.100.7')).status)
		expect(statuses.slice(0, 10).every((code) => code === 200)).toBe(true)
		expect(statuses[10]).toBe(429)
	})

	it('accepts signed URLs from our pages and rejects tampered ones', async () => {
		env.RENDER_HMAC_SECRET = 'secret'
		const params = new URLSearchParams('c=1040000100')
		params.set('lang', 'en')
		const request = spark.parseSparkImageRequest(params)!
		const signed = new URL(spark.shareImage.signedUrl('http://localhost', request.canonical))
		expect((await get(signed.search.slice(1))).status).toBe(200)

		signed.searchParams.set('c', '1040000200')
		expect(await status(get(signed.search.slice(1)))).toBe(403)
	})

	it('passes API rate limits through and answers 503 when the renderer is busy', async () => {
		const limited = apiFetch(
			() => new Response('{}', { status: 429, headers: { 'Retry-After': '30' } })
		)
		const res = await get('c=1040000100', limited.fetch)
		expect(res.status).toBe(429)
		expect(res.headers.get('retry-after')).toBe('30')

		busy = true
		expect((await get('c=1040000200')).status).toBe(503)
	})
})
