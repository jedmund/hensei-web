/** Full event records (GameEvent, camelCased) for the detail and form tests */
import type { GameEvent } from '$lib/types/api/event'

export const detailRecords = {
	// A Unite and Fight with its number, boss element and raids
	guildWar: {
		id: '0b6f2c4e-1d2a-4c3b-9e8f-7a6b5c4d3e2f',
		name: { en: 'Unite and Fight #72', ja: '第72回古戦場' },
		kind: 'unite_and_fight',
		series: 'unite_and_fight',
		element: 2,
		advantageElement: 3,
		startsAt: '2026-11-08T10:00:00.000Z',
		endsAt: '2026-11-15T14:59:59.000Z',
		status: 'approved',
		imageUrl: null,
		eventNumber: 72,
		raids: [
			{
				id: 'r-uf-nm200',
				slug: 'uf-nm200',
				name: { en: 'NM200', ja: 'NM200' },
				level: 200,
				element: 2,
				playerCount: 1,
				extra: false
			}
		]
	},
	// A story event: no series, element or raids
	story: {
		id: '5c1d9e2a-8b7f-4a6e-9d3c-2b1a0f9e8d7c',
		name: { en: 'A Midsummer Feast', ja: '' },
		kind: 'story_event',
		series: null,
		element: null,
		advantageElement: null,
		startsAt: '2026-08-01T10:00:00.000Z',
		endsAt: '2026-08-10T14:59:00.000Z',
		status: 'approved',
		imageUrl: null,
		eventNumber: null,
		raids: []
	}
} as unknown as Record<'guildWar' | 'story', GameEvent>
