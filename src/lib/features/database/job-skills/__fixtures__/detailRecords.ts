/**
 * Full records for three contrasting job skills, shaped like the API's
 * JobSkillBlueprint. `detail-baseline.json` holds the Info tab text the
 * hand-written detail page drew for each, captured 2026-11-01 by mounting it
 * on these records before it was deleted.
 */
import type { JobSkill } from '$lib/types/api/entities'
import { detailRecords as jobs } from '$lib/features/database/jobs/__fixtures__/detailRecords'

const records = {
	// A main skill that is also a subskill, with its game ids
	mainSub: {
		id: 's-rage',
		name: { en: 'Rage IV', ja: 'レイジIV' },
		slug: 'rage-iv',
		color: 2,
		main: true,
		sub: true,
		emp: false,
		base: false,
		order: 1,
		imageId: '2710_3',
		actionId: 203921,
		job: jobs.paladin
	},
	// An EMP skill without game ids
	emp: {
		id: 's-armor-break',
		name: { en: 'Armor Break', ja: 'アーマーブレイク' },
		slug: 'armor-break',
		color: 0,
		main: false,
		sub: false,
		emp: true,
		base: false,
		order: 7,
		job: jobs.fighter
	},
	// No kind flag set (three Street King skills are like this)
	unflagged: {
		id: 's-couteau-royal',
		name: { en: 'Couteau Royal', ja: '' },
		slug: 'couteau-royal',
		color: 4,
		main: false,
		sub: false,
		emp: false,
		base: false,
		order: 0,
		job: jobs.wizardOrigin
	}
}

export const detailRecords = records as unknown as Record<keyof typeof records, JobSkill>
