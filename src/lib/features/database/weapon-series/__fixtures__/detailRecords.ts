/**
 * Full records for three contrasting weapon series, shaped like the API's
 * `full` view. `detail-baseline.json` holds the text the hand-written detail
 * page (`series/weapons/[slug]`) drew for each, captured 2026-11-01 by
 * mounting it on these records before it was deleted.
 */
import type { WeaponSeries } from '$lib/types/api/weaponSeries'

export const detailRecords = {
	// Keys, awakening and AX skills, no variants
	keyed: {
		id: 'ws-keyed',
		name: { en: 'Dark Opus', ja: 'オプス' },
		slug: 'dark-opus',
		order: 3,
		extra: false,
		elementChangeable: false,
		hasWeaponKeys: true,
		hasAwakening: true,
		augmentType: 'ax',
		numWeaponKeys: 2,
		weaponCount: 36,
		variants: []
	},
	// Variants that override some flags
	variants: {
		id: 'ws-variants',
		name: { en: 'Class Champion', ja: 'クラスチャンピオン' },
		slug: 'class-champion',
		order: 41,
		extra: false,
		elementChangeable: true,
		hasWeaponKeys: true,
		hasAwakening: false,
		augmentType: 'no_augment',
		numWeaponKeys: null,
		weaponCount: 12,
		variants: [
			{
				id: 'v-forged',
				name: 'Forged',
				hasWeaponKeys: null,
				hasAwakening: null,
				numWeaponKeys: null,
				augmentType: null,
				elementChangeable: null,
				extra: null
			},
			{
				id: 'v-replica',
				name: 'Replica',
				hasWeaponKeys: true,
				hasAwakening: null,
				numWeaponKeys: 1,
				augmentType: null,
				elementChangeable: null,
				extra: null
			}
		]
	},
	// Extra grid, befoulment, no Japanese name
	plain: {
		id: 'ws-plain',
		name: { en: 'Abyssal', ja: '' },
		slug: 'abyssal',
		order: 45,
		extra: true,
		elementChangeable: false,
		hasWeaponKeys: false,
		hasAwakening: false,
		augmentType: 'befoulment',
		numWeaponKeys: null,
		weaponCount: 0,
		variants: []
	}
} satisfies Record<string, WeaponSeries>
