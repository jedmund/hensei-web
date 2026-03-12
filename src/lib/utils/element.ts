import { getBasePath } from '$lib/utils/images'

interface ElementData {
	en: string
	ja: string
	opposite_id: number
}

export const ELEMENTS: Record<number, ElementData> = {
	0: { en: 'Null', ja: '無', opposite_id: 0 },
	1: { en: 'Wind', ja: '風', opposite_id: 4 },
	2: { en: 'Fire', ja: '火', opposite_id: 3 },
	3: { en: 'Water', ja: '水', opposite_id: 2 },
	4: { en: 'Earth', ja: '土', opposite_id: 1 },
	5: { en: 'Dark', ja: '闇', opposite_id: 6 },
	6: { en: 'Light', ja: '光', opposite_id: 5 }
}

// Legacy support - still used in many places
export const ELEMENT_LABELS: Record<number, string> = {
	0: 'Null',
	1: 'Wind',
	2: 'Fire',
	3: 'Water',
	4: 'Earth',
	5: 'Dark',
	6: 'Light'
}

export function getElementLabel(element?: number): string {
	if (element === undefined || element === null) return '—'
	return ELEMENT_LABELS[element] || '—'
}

export function getElementClass(element?: number): string {
	if (element === undefined || element === null) return ''
	const label = ELEMENT_LABELS[element]
	return label ? `element-${label.toLowerCase()}` : ''
}

export function getElementIcon(element?: number): string {
	const label = getElementLabel(element)
	if (label === '—') return ''
	if (label === 'Null') return `${getBasePath()}/labels/element/Label_Element_Any.png`
	// Capitalize first letter for filename
	const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)
	return `${getBasePath()}/labels/element/Label_Element_${capitalizedLabel}.png`
}

export function getElementOptions() {
	return Object.entries(ELEMENT_LABELS).map(([value, label]) => ({
		value: Number(value),
		label
	}))
}

export function getElementName(element?: number, locale: 'en' | 'ja' = 'en'): string {
	if (element === undefined || element === null) return '—'
	const elementData = ELEMENTS[element]
	if (!elementData) return '—'
	return elementData[locale]
}

export function getOppositeElement(element?: number): number | undefined {
	if (element === undefined || element === null) return undefined
	const elementData = ELEMENTS[element]
	return elementData?.opposite_id
}

/**
 * Get the path to the element image from /images/elements/
 * Used by ElementPicker component
 */
export function getElementImage(element?: number): string {
	if (element === undefined || element === null) return ''
	const label = ELEMENT_LABELS[element]?.toLowerCase() ?? 'null'
	return `${getBasePath()}/elements/${label}.png`
}