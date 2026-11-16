import { describe, expect, it, vi } from 'vitest'
import { load } from '../+layout'
import { stickerQueries } from '$lib/api/queries/sticker.queries'

type LoadEvent = Parameters<typeof load>[0]

describe('root layout load', () => {
	it('tries the sticker prefetch once, so a failing API cannot hold up the page', async () => {
		const fetch = vi.fn(async () => {
			throw new TypeError('fetch failed')
		})

		const started = Date.now()
		const result = await load({ data: {}, fetch } as unknown as LoadEvent)

		expect(fetch).toHaveBeenCalledTimes(1)
		// The adapter's retries back off for 1s, 2s and 4s
		expect(Date.now() - started).toBeLessThan(1000)
		const { queryClient } = result as { queryClient: import('@tanstack/svelte-query').QueryClient }
		expect(queryClient.getQueryData(stickerQueries.active().queryKey)).toBeUndefined()
	})
})
