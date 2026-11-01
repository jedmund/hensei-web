/**
 * Full records for two contrasting job accessories, shaped like the API's
 * JobAccessoryBlueprint. `detail-baseline.json` holds the Info tab text the
 * hand-written detail page drew for each, captured 2026-11-01 by mounting it
 * on these records before it was deleted.
 */
import type { JobAccessory } from '$lib/types/api/entities'
import { detailRecords as jobs } from '$lib/features/database/jobs/__fixtures__/detailRecords'

const records = {
	shield: {
		id: 'a-obelisk',
		granblueId: '4013',
		name: { en: 'Obelisk', ja: 'オベリスク' },
		rarity: 3,
		releaseDate: '2022-01-25',
		accessoryType: 1,
		job: jobs.paladin
	},
	manatura: {
		id: 'a-schalk',
		granblueId: '2',
		name: { en: 'Schalk', ja: 'シャルク' },
		rarity: 1,
		accessoryType: 2,
		job: jobs.wizardOrigin
	}
}

export const detailRecords = records as unknown as Record<keyof typeof records, JobAccessory>
