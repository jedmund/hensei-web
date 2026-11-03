/**
 * Display formatting for the Weapon Skill Boosts panel. The API returns values at
 * the game's internal precision (4 decimals); the site shows one decimal.
 */

/** Round half away from zero to one decimal, the way the API rounds. */
function roundToTenth(value: number): number {
	const rounded = (Math.sign(value) * Math.round(Math.abs(value) * 10)) / 10
	return rounded === 0 ? 0 : rounded
}

/** A plain number at one decimal, trailing zero trimmed (5.6, 3) */
export function formatBoostNumber(value: number): string {
	return String(roundToTenth(value))
}

/** A boost value: percents at one decimal ("756.8%"), flat counts as "+100,000" */
export function formatBoostValue(value: number, flat = false): string {
	if (flat) {
		const rounded = Math.round(value)
		return `${rounded < 0 ? '' : '+'}${rounded.toLocaleString('en-US')}`
	}
	return `${formatBoostNumber(value)}%`
}
