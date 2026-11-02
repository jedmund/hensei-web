/**
 * Full records for three contrasting bullets from the production copy,
 * shaped like the API's BulletBlueprint. `detail-baseline.json` holds the
 * Info tab text the hand-written detail page drew for each, captured
 * 2026-11-01 by mounting it on these records before it was deleted.
 */
import type { Bullet } from '$lib/types/api/entities'

const records = {
	// A Parabellum with no effect text
	iron: {
		id: 'b-iron',
		granblueId: '10101',
		slug: 'iron-bullet',
		name: { en: 'Iron Bullet', ja: 'アイアンバレット' },
		effect: { en: null, ja: null },
		bulletType: 1,
		atk: 90,
		hitsAll: false,
		order: 1
	},
	// A Cartridge that hits all foes
	shotshell: {
		id: 'b-shotshell',
		granblueId: '30101',
		slug: 'shotshell',
		name: { en: 'Shotshell', ja: 'シェルバレット' },
		effect: { en: null, ja: null },
		bulletType: 3,
		atk: 35,
		hitsAll: true,
		order: 43
	},
	// An Aetherial with an effect
	neptune: {
		id: 'b-neptune',
		granblueId: '40801',
		slug: 'neptune-point',
		name: { en: 'Neptune Point', ja: 'ネプチューンポイント' },
		effect: { en: 'Chance for each ally to gain Water ATK Boosted (Stackable).', ja: null },
		bulletType: 4,
		atk: 65,
		hitsAll: false,
		order: 96
	}
}

export const detailRecords = records as unknown as Record<keyof typeof records, Bullet>
