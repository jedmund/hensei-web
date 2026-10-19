/**
 * Sticker catalogue mutation tests: each operation refreshes the catalogue.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MutationObserver, type QueryClient } from '@tanstack/svelte-query'
import { reorderStickersOptions } from '../sticker-catalogue.mutations'
import { createTestQueryClient } from './helpers'
import { stickerKeys } from '$lib/api/queries/sticker.queries'

vi.mock('$lib/api/adapters/sticker.adapter', () => ({
	stickerAdapter: {
		reorderStickers: vi.fn()
	}
}))

const { stickerAdapter } = await import('$lib/api/adapters/sticker.adapter')

let queryClient: QueryClient

function run<TVars>(options: object, vars: TVars) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const observer = new MutationObserver<unknown, Error, TVars, any>(queryClient, options as any)
	return observer.mutate(vars)
}

beforeEach(() => {
	queryClient = createTestQueryClient()
	vi.clearAllMocks()
})

describe('reorderStickersOptions', () => {
	it('invalidates the sticker catalogue', async () => {
		;(stickerAdapter.reorderStickers as ReturnType<typeof vi.fn>).mockResolvedValue([])
		const spy = vi.spyOn(queryClient, 'invalidateQueries')

		await run(reorderStickersOptions(queryClient), ['a', 'b'])

		expect(stickerAdapter.reorderStickers).toHaveBeenCalledWith(['a', 'b'])
		expect(spy).toHaveBeenCalledWith({ queryKey: stickerKeys.all })
	})
})
