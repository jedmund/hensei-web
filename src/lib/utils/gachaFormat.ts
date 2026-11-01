/**
 * Numbers on the gacha result card. The API sends counts and costs as
 * decimal strings, since long runs outgrow a double.
 */

/** A count or cost: digits grouped for the locale, trailing zeros dropped */
export function formatAmount(value: string, locale: string): string {
	const [integer = '0', fraction = ''] = value.split('.')
	const decimals = fraction.replace(/0+$/, '')
	return `${BigInt(integer).toLocaleString(locale)}${decimals ? `.${decimals}` : ''}`
}

/** A probability, to four significant digits */
export function formatProbability(value: number, locale: string): string {
	return new Intl.NumberFormat(locale, {
		style: 'percent',
		maximumSignificantDigits: 4
	}).format(value)
}

/** One count as a share of another, to two decimal places */
export function formatRate(part: string, whole: string, locale: string): string {
	return new Intl.NumberFormat(locale, {
		style: 'percent',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(Number(part) / Number(whole))
}

/** An expected value, to at most two decimal places */
export function formatDecimal(value: number, locale: string): string {
	return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)
}
