import { getBasePath } from '$lib/utils/images'
import * as m from '$lib/paraglide/messages'

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

// English keys used for file paths and CSS classes — not for display
const ELEMENT_KEYS: Record<number, string> = {
	0: 'Null',
	1: 'Wind',
	2: 'Fire',
	3: 'Water',
	4: 'Earth',
	5: 'Dark',
	6: 'Light'
}

// Hex colors for each element (used in charts, filters, SVG rendering)
const ELEMENT_COLORS: Record<number, string> = {
	0: '#888888',
	1: '#3ee489',
	2: '#fa6d6d',
	3: '#6cc9ff',
	4: '#fd9f5b',
	5: '#de7bff',
	6: '#e8d633'
}

// Emoji for each element (used in embed titles, text representations)
const ELEMENT_EMOJIS: Record<number, string> = {
	0: '⚪',
	1: '🟢',
	2: '🔴',
	3: '🔵',
	4: '🟤',
	5: '🟣',
	6: '🟡'
}

// Display order: Fire → Water → Earth → Wind → Light → Dark
export const ELEMENT_DISPLAY_ORDER = [2, 3, 4, 1, 6, 5] as const

const ELEMENT_MESSAGES: Record<number, () => string> = {
	0: m.element_null,
	1: m.element_wind,
	2: m.element_fire,
	3: m.element_water,
	4: m.element_earth,
	5: m.element_dark,
	6: m.element_light
}

/** @deprecated Use getElementLabel() instead for display text */
export const ELEMENT_LABELS = ELEMENT_KEYS

export function getElementLabel(element?: number): string {
	if (element === undefined || element === null) return '—'
	const messageFn = ELEMENT_MESSAGES[element]
	return messageFn ? messageFn() : '—'
}

export function getElementClass(element?: number): string {
	if (element === undefined || element === null) return ''
	const key = ELEMENT_KEYS[element]
	return key ? `element-${key.toLowerCase()}` : ''
}

export function getElementIcon(element?: number): string {
	if (element === undefined || element === null) return ''
	const key = ELEMENT_KEYS[element]
	if (!key) return ''
	if (key === 'Null') return `${getBasePath()}/labels/element/Label_Element_Any.png`
	const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
	return `${getBasePath()}/labels/element/Label_Element_${capitalizedKey}.png`
}

export function getElementKey(element?: number): string {
	if (element === undefined || element === null) return 'null'
	return (ELEMENT_KEYS[element] ?? 'null').toLowerCase()
}

export function getElementColor(element?: number): string {
	if (element === undefined || element === null) return '#888888'
	return ELEMENT_COLORS[element] ?? '#888888'
}

export function getElementEmoji(element?: number | null): string {
	return ELEMENT_EMOJIS[element ?? 0] ?? '⚪'
}

export function getElementOptions() {
	return Object.entries(ELEMENT_MESSAGES).map(([value, messageFn]) => ({
		value: Number(value),
		label: messageFn()
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
	const key = ELEMENT_KEYS[element]?.toLowerCase() ?? 'null'
	return `${getBasePath()}/elements/${key}.png`
}
