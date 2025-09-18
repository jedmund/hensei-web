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
	if (label === '—' || label === 'Null') return ''
	// Capitalize first letter for filename
	const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)
	return `/images/labels/element/Label_Element_${capitalizedLabel}.png`
}

export function getElementOptions() {
	return Object.entries(ELEMENT_LABELS).map(([value, label]) => ({
		value: Number(value),
		label
	}))
}