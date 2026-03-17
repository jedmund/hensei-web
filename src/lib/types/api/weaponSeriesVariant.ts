import type { AugmentType } from './weaponStatModifier'

export interface WeaponSeriesVariant {
	id: string
	name: string
	hasWeaponKeys: boolean | null
	hasAwakening: boolean | null
	numWeaponKeys: number | null
	augmentType: AugmentType | null
	elementChangeable: boolean | null
	extra: boolean | null
}

export interface CreateWeaponSeriesVariantPayload {
	name: string
	has_weapon_keys?: boolean | null
	has_awakening?: boolean | null
	num_weapon_keys?: number | null
	augment_type?: AugmentType | null
	element_changeable?: boolean | null
	extra?: boolean | null
}

export interface UpdateWeaponSeriesVariantPayload {
	name?: string
	has_weapon_keys?: boolean | null
	has_awakening?: boolean | null
	num_weapon_keys?: number | null
	augment_type?: AugmentType | null
	element_changeable?: boolean | null
	extra?: boolean | null
}
