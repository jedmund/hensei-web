/** Display helpers shared by the built-in cells and client sorting */
import { appLocale } from '$lib/utils/locale'
import type { NameValue } from './types'

/** The name in the current locale, falling back to the other one */
export function primaryName(name: NameValue | null | undefined): string {
	if (!name) return ''
	const locale = appLocale()
	return name[locale] || name.en || name.ja || ''
}

/** The name in the other locale, or '' when it's missing or identical */
export function secondaryName(name: NameValue | null | undefined): string {
	if (!name) return ''
	const other = appLocale() === 'ja' ? name.en : name.ja
	return other && other !== primaryName(name) ? other : ''
}

/** YYYY-MM-DD in UTC, matching the existing database grid; '' when invalid */
export function formatDate(value: unknown): string {
	if (value === null || value === undefined || value === '') return ''
	const date = value instanceof Date ? value : new Date(String(value))
	if (Number.isNaN(date.getTime())) return ''
	const year = date.getUTCFullYear()
	const month = String(date.getUTCMonth() + 1).padStart(2, '0')
	const day = String(date.getUTCDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}
