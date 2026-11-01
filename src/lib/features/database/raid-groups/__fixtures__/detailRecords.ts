/** Full raid group records (RaidGroupFull, camelCased) for the detail and form tests */
import type { RaidGroupFull } from '$lib/types/api/raid'

export const detailRecords = {
	// A group with member raids and most flags set
	full: {
		id: 'g-six-dragons',
		name: { en: 'Six-Dragons', ja: '六竜' },
		section: 1,
		order: 7,
		difficulty: 8,
		hl: true,
		extra: false,
		guidebooks: true,
		unlimited: true,
		supportSummon: true,
		contentMode: null,
		raids: [
			{
				id: 'r-wilnas',
				slug: 'wilnas',
				name: { en: 'Wilnas', ja: 'ウィルナス' },
				level: 200,
				element: 1,
				playerCount: 6,
				extra: false
			},
			{
				id: 'r-wamdus',
				slug: 'wamdus',
				name: { en: 'Wamdus', ja: 'ワムデュス' },
				level: null,
				element: 2,
				playerCount: 6,
				extra: false
			}
		]
	},
	// A Farming group: section 0, no raids, no support summon
	empty: {
		id: 'g-farming',
		name: { en: 'Farming', ja: '周回' },
		section: 0,
		order: 0,
		difficulty: null,
		hl: false,
		extra: false,
		guidebooks: false,
		unlimited: false,
		supportSummon: false,
		contentMode: null,
		raids: []
	}
} as unknown as Record<'full' | 'empty', RaidGroupFull>
