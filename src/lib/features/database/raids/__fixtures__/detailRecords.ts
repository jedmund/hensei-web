/** Full raid records (RaidFull, camelCased) for the detail and form tests */
import type { RaidFull } from '$lib/types/api/raid'

const sixDragons = {
	id: 'g-six-dragons',
	name: { en: 'Six-Dragons', ja: '六竜' },
	section: 1,
	order: 7,
	difficulty: 8,
	hl: true,
	extra: false,
	guidebooks: true,
	unlimited: false,
	supportSummon: true
}

export const detailRecords = {
	// A multiplayer raid with every value set
	full: {
		id: 'r-wilnas',
		slug: 'wilnas',
		name: { en: 'Wilnas', ja: 'ウィルナス' },
		level: 200,
		element: 1,
		playerCount: 6,
		extra: false,
		enemyId: 7300101,
		summonId: 2040412,
		questId: 305181,
		releasedAt: '2023-03-10',
		group: sixDragons
	},
	// Solo content in an extra group, with nothing optional set
	sparse: {
		id: 'r-arcarum',
		slug: 'arcarum-justice',
		name: { en: 'Justice', ja: '' },
		level: null,
		element: 0,
		playerCount: 1,
		extra: true,
		releasedAt: null,
		group: {
			id: 'g-arcarum',
			name: { en: 'Arcarum', ja: 'アーカルム' },
			section: 3,
			order: 2,
			difficulty: 0,
			hl: false,
			extra: true,
			guidebooks: false,
			unlimited: false,
			supportSummon: false
		}
	}
} as unknown as Record<'full' | 'sparse', RaidFull>
