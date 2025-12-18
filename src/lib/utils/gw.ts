/**
 * Guild War (Unite and Fight) utility functions and constants
 */

/**
 * Format a score number with commas for display
 */
export function formatScore(score: number): string {
	return score.toLocaleString()
}

/**
 * Parse a score string (with commas) back to a number
 */
export function parseScore(value: string): number {
	return parseInt(value.replace(/,/g, ''), 10)
}

/**
 * Element labels matching GranblueEnums::ELEMENTS
 */
export const ELEMENT_LABELS: Record<number, string> = {
	0: 'Null',
	1: 'Wind',
	2: 'Fire',
	3: 'Water',
	4: 'Earth',
	5: 'Dark',
	6: 'Light'
}

/**
 * Element CSS class names for badge styling
 */
export const ELEMENT_CSS_CLASSES: Record<number, string> = {
	0: 'null',
	1: 'wind',
	2: 'fire',
	3: 'water',
	4: 'earth',
	5: 'dark',
	6: 'light'
}

/**
 * Element hex colors for SVG rendering (used in dropdowns)
 */
export const ELEMENT_HEX_COLORS: Record<string, string> = {
	wind: '#3ee489',
	fire: '#fa6d6d',
	water: '#6cc9ff',
	earth: '#fd9f5b',
	dark: '#de7bff',
	light: '#e8d633'
}

/**
 * Get element hex color by element ID
 */
export function getElementColor(elementId: number): string {
	const className = ELEMENT_CSS_CLASSES[elementId]
	if (!className) return '#888'
	return ELEMENT_HEX_COLORS[className] ?? '#888'
}
