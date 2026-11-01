/**
 * Full records for three contrasting jobs, shaped like the API's JobBlueprint.
 * `detail-baseline.json` holds the Info tab text the hand-written detail
 * (JobDetail) drew for each, captured 2026-11-01 by mounting it on these
 * records before it was deleted.
 */
import type { Job } from '$lib/types/api/entities'

const records = {
	// Row IV with a shield, master level and ultimate mastery
	paladin: {
		id: 'j-paladin',
		granblueId: '100401',
		name: { en: 'Paladin', ja: 'パラディン' },
		row: '4',
		order: 3,
		proficiency: [3, 1],
		masterLevel: true,
		ultimateMastery: true,
		auxWeapon: false,
		accessory: true,
		accessoryType: 1
	},
	// A Class I job: shares its granblue_id with its Class II successor
	fighter: {
		id: 'j-fighter',
		granblueId: '100001',
		name: { en: 'Fighter', ja: 'ファイター' },
		row: '1',
		order: 1,
		proficiency: [1, 4],
		masterLevel: false,
		ultimateMastery: false,
		auxWeapon: false,
		accessory: false,
		accessoryType: 0
	},
	// An Origin job with a manatura and an aux weapon
	wizardOrigin: {
		id: 'j-wizard-origin',
		granblueId: '470301',
		name: { en: 'Wizard Origin', ja: 'ウィザード・オリジン' },
		row: 'o1',
		order: 4,
		proficiency: [5, 2],
		masterLevel: true,
		ultimateMastery: false,
		auxWeapon: true,
		accessory: true,
		accessoryType: 2
	}
}

export const detailRecords = records as unknown as Record<keyof typeof records, Job>
