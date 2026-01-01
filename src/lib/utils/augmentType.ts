import type { AugmentType } from '$lib/types/api/weaponStatModifier'

interface AugmentTypeData {
	en: string
	ja: string
}

export const AUGMENT_TYPES: Record<AugmentType, AugmentTypeData> = {
	no_augment: { en: 'None', ja: 'なし' },
	ax: { en: 'AX Skills', ja: 'AXスキル' },
	befoulment: { en: 'Befoulment', ja: '禍スキル' }
}

export const AUGMENT_TYPE_LABELS: Record<AugmentType, string> = {
	no_augment: 'None',
	ax: 'AX Skills',
	befoulment: 'Befoulment'
}

export function getAugmentTypeLabel(type?: AugmentType): string {
	if (!type) return '—'
	return AUGMENT_TYPE_LABELS[type] || '—'
}

export function getAugmentTypeName(type?: AugmentType, locale: 'en' | 'ja' = 'en'): string {
	if (!type) return '—'
	const data = AUGMENT_TYPES[type]
	if (!data) return '—'
	return data[locale]
}

export function getAugmentTypeOptions(): Array<{ value: AugmentType; label: string }> {
	return Object.entries(AUGMENT_TYPE_LABELS).map(([value, label]) => ({
		value: value as AugmentType,
		label
	}))
}

export function getAugmentTypeClass(type?: AugmentType): string {
	if (!type || type === 'no_augment') return ''
	return `augment-${type}`
}
