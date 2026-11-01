/**
 * Full records for two character series, shaped like the API's `full` view.
 * `detail-baseline.json` holds the text the hand-written detail page
 * (`series/characters/[slug]`) drew for each, captured 2026-11-01 by mounting
 * it on these records before it was deleted.
 */
import type { CharacterSeries } from '$lib/types/api/characterSeries'

export const detailRecords = {
	grand: {
		id: 'cs-grand',
		name: { en: 'Grand', ja: 'リミテッド' },
		slug: 'grand',
		order: 1,
		characterCount: 72
	},
	// No Japanese name and nobody in it yet
	empty: {
		id: 'cs-empty',
		name: { en: 'Formal', ja: '' },
		slug: 'formal',
		order: 15,
		characterCount: 0
	}
} satisfies Record<string, CharacterSeries>
