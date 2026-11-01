/**
 * Derive the record name and mode for database breadcrumbs
 * from page data, so the breadcrumb and "Recently opened" don't depend on
 * document.title.
 */
import { m } from '$lib/paraglide/messages'
import { DATABASE_SECTIONS, delocalize } from './sections'

/** Keys detail-page loads return their record under (`record` for registered resources) */
const RECORD_KEYS = [
	'record',
	'character',
	'job',
	'bullet',
	'skill',
	'accessory',
	'roleRecord',
	'series'
] as const

type NameLike = string | { en?: string | null; ja?: string | null } | null | undefined

function pickName(record: Record<string, unknown>, locale: string): string | null {
	const name = record.name as NameLike
	if (typeof name === 'string' && name) return name
	if (name && typeof name === 'object') {
		const preferred = locale === 'ja' ? (name.ja ?? name.en) : (name.en ?? name.ja)
		if (preferred) return preferred
	}
	const en = record.nameEn as string | undefined
	const jp = (record.nameJp ?? record.nameJa) as string | undefined
	return (locale === 'ja' ? (jp ?? en) : (en ?? jp)) ?? null
}

export function recordTitle(data: Record<string, unknown>, locale: string): string | null {
	for (const key of RECORD_KEYS) {
		const record = data[key]
		if (record && typeof record === 'object') {
			const name = pickName(record as Record<string, unknown>, locale)
			if (name) return name
		}
	}
	if (typeof data.modifier === 'string') return data.modifier
	return null
}

/** "Edit", or the matching "New …" action label for create/import pages. */
export function modeLabel(pathname: string): string | null {
	const path = delocalize(pathname)
	if (path.endsWith('/edit')) return m.action_edit()
	for (const section of DATABASE_SECTIONS) {
		for (const group of section.actions ?? []) {
			const action = group.find((a) => a.href === path)
			if (action) return action.label()
		}
	}
	return null
}
