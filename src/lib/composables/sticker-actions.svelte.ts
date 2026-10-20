/**
 * Giving, moving and taking back the viewer's sticker on a team. Each
 * shows in the sticker area right away (the mutations update the cache
 * first), so only a failure is reported, and is rolled back.
 */
import { toast } from 'svelte-sonner'
import { useGiveSticker, useRemoveSticker } from '$lib/api/mutations/sticker.mutations'
import { extractErrorMessage } from '$lib/utils/errors'
import type { Party, StickerPlacement } from '$lib/types/api/party'
import * as m from '$lib/paraglide/messages'

interface StickerActionsOptions {
	getParty: () => Pick<Party, 'id' | 'shortcode'>
}

export function useStickerActions({ getParty }: StickerActionsOptions) {
	const giveMut = useGiveSticker()
	const removeMut = useRemoveSticker()
	const busy = $derived(giveMut.isPending || removeMut.isPending)

	async function run(save: () => Promise<unknown>): Promise<boolean> {
		try {
			await save()
			return true
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.sticker_toast_failed()))
			return false
		}
	}

	function params() {
		const { id, shortcode } = getParty()
		return { id, shortcode }
	}

	return {
		/** A give or take-back is still saving */
		get busy() {
			return busy
		},

		/** Gives `slug` (swapping the viewer's sticker), optionally placed */
		give(slug: string, placement?: StickerPlacement): Promise<boolean> {
			if (busy) return Promise.resolve(false)
			return run(() =>
				giveMut.mutateAsync(placement ? { ...params(), slug, placement } : { ...params(), slug })
			)
		},

		/** Moves the viewer's sticker. Not held back while another save is in
		 * flight: the latest position wins. */
		move(slug: string, placement: StickerPlacement): Promise<boolean> {
			return run(() => giveMut.mutateAsync({ ...params(), slug, placement }))
		},

		/** Takes the viewer's sticker back */
		remove(): Promise<boolean> {
			if (busy) return Promise.resolve(false)
			return run(() => removeMut.mutateAsync(params()))
		}
	}
}

export type StickerActions = ReturnType<typeof useStickerActions>
