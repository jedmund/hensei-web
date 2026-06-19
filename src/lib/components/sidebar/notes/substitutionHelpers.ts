import type { Substitution } from '$lib/types/api/party'
import { localizedName } from '$lib/utils/locale'
import {
	getCharacterImage,
	getWeaponImage,
	getSummonImage,
	getPlaceholder
} from '$lib/features/database/detail/image'
import { getWeaponFallbackImage, STYLE_SWAP_POSE } from '$lib/utils/images'

export type GridItemType = 'character' | 'weapon' | 'summon'

export function getGridTypeName(type: GridItemType): string {
	if (type === 'character') return 'GridCharacter'
	if (type === 'summon') return 'GridSummon'
	return 'GridWeapon'
}

export function getSubstituteName(sub: Substitution): string {
	if (sub.gridCharacter) return localizedName(sub.gridCharacter.character?.name) ?? '—'
	if (sub.gridWeapon) return localizedName(sub.gridWeapon.weapon?.name) ?? '—'
	if (sub.gridSummon) return localizedName(sub.gridSummon.summon?.name) ?? '—'
	return '—'
}

export function getSubstituteImage(sub: Substitution, type: GridItemType): string {
	if (sub.gridCharacter?.character) {
		const c = sub.gridCharacter.character
		return getCharacterImage(c.granblueId, 'square', c.styleSwap ? STYLE_SWAP_POSE : '01')
	}
	if (sub.gridWeapon?.weapon) {
		const w = sub.gridWeapon.weapon
		return getWeaponImage(w.granblueId, 'square', w.element === 0 ? 0 : undefined)
	}
	if (sub.gridSummon?.summon) {
		return getSummonImage(sub.gridSummon.summon.granblueId, 'square')
	}
	return getPlaceholder(type, 'square')
}

export function getSubstituteElement(sub: Substitution): number | undefined {
	return (
		sub.gridCharacter?.character?.element ??
		sub.gridWeapon?.weapon?.element ??
		sub.gridSummon?.summon?.element
	)
}

export function getSubstituteProficiencies(sub: Substitution): number[] {
	const charProfs = sub.gridCharacter?.character?.proficiency
	if (Array.isArray(charProfs)) return charProfs.filter((p): p is number => p !== undefined)
	const weaponProf = sub.gridWeapon?.weapon?.proficiency
	if (typeof weaponProf === 'number') return [weaponProf]
	return []
}

// `owned` is stamped by the API per current_user's collection. The substitute
// grid's own `collection_*_id` is never set on substitutes (they're created
// from raw catalog ids), so it's the wrong signal.
export function isFromCollection(sub: Substitution): boolean {
	return !!(sub.gridCharacter?.owned || sub.gridWeapon?.owned || sub.gridSummon?.owned)
}

export function getSubstituteFallbackImage(sub: Substitution): string | undefined {
	if (sub.gridWeapon?.weapon && sub.gridWeapon.weapon.element === 0) {
		return getWeaponFallbackImage(sub.gridWeapon.weapon.granblueId, 'square')
	}
	return undefined
}

export function getSubstituteItemId(sub: Substitution): string | null {
	return (
		sub.gridCharacter?.character?.id ??
		sub.gridWeapon?.weapon?.id ??
		sub.gridSummon?.summon?.id ??
		null
	)
}
