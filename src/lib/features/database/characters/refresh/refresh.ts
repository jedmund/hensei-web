/**
 * Presentation helpers for a character refresh preview (contract C6): what
 * changed, grouped and named in plain words.
 */

import * as m from '$lib/paraglide/messages'
import type {
	CharacterRefreshResult,
	RefreshBatchItem,
	RefreshBatchStatus,
	RefreshChange,
	RefreshCounts,
	RefreshFailure,
	RefreshIconFallback,
	RefreshItemStatus
} from '$lib/api/adapters/characterRefresh.adapter'
import { MAX_BATCH_CHARACTERS } from '$lib/api/adapters/characterRefresh.adapter'
import { localizedName } from '$lib/utils/locale'

/** A refresh name ({en, ja}, either may be null) in the current locale */
export function refreshName(
	name: { en?: string | null; ja?: string | null } | null | undefined
): string {
	return localizedName({ en: name?.en ?? '', ja: name?.ja ?? '' })
}

/** none: nothing to apply; text_only: the wikitext changed but no skill does */
export type RefreshOutcome = 'none' | 'text_only' | 'changes'

export function countsTotal(counts: RefreshCounts): number {
	return Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0)
}

export function refreshOutcome(result: CharacterRefreshResult): RefreshOutcome {
	if (result.changes.length > 0 || countsTotal(result.counts) > 0) return 'changes'
	if (result.wikiChanged || result.wikiJpChanged) return 'text_only'
	return 'none'
}

// Skill kinds in the order the game shows them
const KIND_ORDER = ['ougi', 'ability', 'support']

export function kindLabel(kind: string): string {
	switch (kind) {
		case 'ougi':
			return m.character_refresh_kind_ougi()
		case 'ability':
			return m.character_refresh_kind_ability()
		case 'support':
			return m.character_refresh_kind_support()
		default:
			return humanize(kind)
	}
}

export interface ChangeGroup<T> {
	kind: string
	label: string
	items: T[]
}

/** Groups changes (or icon fallbacks) by skill kind, each sorted by position then ordinal. */
export function groupByKind<T extends { kind: string; position: number; ordinal: number }>(
	items: T[]
): ChangeGroup<T>[] {
	const groups = new Map<string, T[]>()
	for (const item of items) {
		const list = groups.get(item.kind) ?? []
		list.push(item)
		groups.set(item.kind, list)
	}
	const rank = (kind: string) => {
		const i = KIND_ORDER.indexOf(kind)
		return i === -1 ? KIND_ORDER.length : i
	}
	return [...groups.entries()]
		.sort(([a], [b]) => rank(a) - rank(b) || a.localeCompare(b))
		.map(([kind, list]) => ({
			kind,
			label: kindLabel(kind),
			items: [...list].sort((a, b) => a.position - b.position || a.ordinal - b.ordinal)
		}))
}

/**
 * Display names for one group's entries. Versions of a skill often share a
 * name (Heal III at two uncaps), so a repeated name gets its version number.
 */
export function entryLabels<T extends { ordinal: number; name: RefreshChange['name'] }>(
	items: T[]
): string[] {
	const names = items.map((item) => refreshName(item.name))
	return names.map((name, i) =>
		names.indexOf(name) !== names.lastIndexOf(name)
			? `${name} (${m.character_refresh_version({ ordinal: items[i]!.ordinal })})`
			: name
	)
}

export function groupChanges(changes: RefreshChange[]): ChangeGroup<RefreshChange>[] {
	return groupByKind(changes)
}

export function groupIconFallbacks(
	fallbacks: RefreshIconFallback[]
): ChangeGroup<RefreshIconFallback>[] {
	return groupByKind(fallbacks)
}

function humanize(column: string): string {
	return column.replace(/_/g, ' ')
}

/**
 * A changed column in plain words. Covers every column the build's Writer
 * diffs (Writer.version_columns) plus `effects`, `links` and the two the API
 * hides today (`slot_game_action_id`, `duplicates`).
 */
export const FIELD_LABELS: Record<string, () => string> = {
	name_en: m.character_refresh_field_name,
	name_jp: m.character_refresh_field_name_jp,
	description_en: m.character_refresh_field_description,
	description_jp: m.character_refresh_field_description_jp,
	cooldown: m.character_refresh_field_cooldown,
	initial_cooldown: m.character_refresh_field_initial_cooldown,
	duration_value: m.character_refresh_field_duration,
	duration_unit: m.character_refresh_field_duration,
	icon: m.character_refresh_field_icon,
	game_icon: m.character_refresh_field_icon,
	effects: m.character_refresh_field_effects,
	links: m.character_refresh_field_links,
	unlock_level: m.character_refresh_field_unlock_level,
	enhance_levels: m.character_refresh_field_enhance_levels,
	min_uncap: m.character_refresh_field_min_uncap,
	transcendence_stage: m.character_refresh_field_transcendence_stage,
	trigger_type: m.character_refresh_field_trigger,
	trigger_value: m.character_refresh_field_trigger,
	type_color: m.character_refresh_field_type_color,
	variant_role: m.character_refresh_field_variant_role,
	ordinal: m.character_refresh_field_ordinal,
	cant_recast: m.character_refresh_field_cant_recast,
	one_time_use: m.character_refresh_field_one_time_use,
	auto_activate: m.character_refresh_field_auto_activate,
	mimicable: m.character_refresh_field_mimicable,
	targets_all: m.character_refresh_field_targets_all,
	game_action_id: m.character_refresh_field_game_action_id,
	slot_game_action_id: m.character_refresh_field_game_action_id,
	duplicates: m.character_refresh_field_duplicates
}

export function fieldLabel(field: string): string {
	// A column added after this list: readable, never snake_case
	return Object.hasOwn(FIELD_LABELS, field) ? FIELD_LABELS[field]!() : humanize(field)
}

/** The changed fields in plain words, without repeats (duration_value + duration_unit → "duration"). */
export function fieldLabels(fields: string[]): string[] {
	return [...new Set(fields.map(fieldLabel))]
}

export function changeLabel(change: RefreshChange['change']): string {
	switch (change) {
		case 'created':
			return m.character_refresh_change_created()
		case 'deleted':
			return m.character_refresh_change_deleted()
		default:
			return m.character_refresh_change_updated()
	}
}

export interface CountRow {
	key: 'slots' | 'versions' | 'effects' | 'links'
	label: string
	parts: string[]
}

/** Count rows with at least one non-zero number, e.g. "Effects: 4 added, 1 updated, 2 removed". */
export function countRows(counts: RefreshCounts): CountRow[] {
	const rows: { key: CountRow['key']; label: string; c?: number; u?: number; d?: number }[] = [
		{
			key: 'slots',
			label: m.character_refresh_count_slots(),
			c: counts.slotsCreated,
			d: counts.slotsDeleted
		},
		{
			key: 'versions',
			label: m.character_refresh_count_versions(),
			c: counts.versionsCreated,
			u: counts.versionsUpdated,
			d: counts.versionsDeleted
		},
		{
			key: 'effects',
			label: m.character_refresh_count_effects(),
			c: counts.effectsCreated,
			u: counts.effectsUpdated,
			d: counts.effectsDeleted
		},
		{
			key: 'links',
			label: m.character_refresh_count_links(),
			c: counts.linksCreated,
			d: counts.linksDeleted
		}
	]
	return rows
		.map(({ key, label, c, u, d }) => {
			const parts: string[] = []
			if (c) parts.push(m.character_refresh_count_created({ count: c }))
			if (u) parts.push(m.character_refresh_count_updated({ count: u }))
			if (d) parts.push(m.character_refresh_count_deleted({ count: d }))
			return { key, label, parts }
		})
		.filter((row) => row.parts.length > 0)
}

export type WikiState = 'changed' | 'unchanged' | 'not_fetched'

export function wikiState(changed: boolean | null): WikiState {
	if (changed === null) return 'not_fetched'
	return changed ? 'changed' : 'unchanged'
}

export function wikiStateLabel(state: WikiState): string {
	switch (state) {
		case 'changed':
			return m.character_refresh_wiki_changed()
		case 'unchanged':
			return m.character_refresh_wiki_unchanged()
		default:
			return m.character_refresh_wiki_not_fetched()
	}
}

/** The message for a failed request; `message` is the API's or the client's own. */
export function failureMessage(failure: RefreshFailure, message?: string | null): string {
	switch (failure) {
		case 'preview_expired':
			return m.character_refresh_expired()
		case 'too_many_characters':
			return m.character_refresh_too_many({ max: MAX_BATCH_CHARACTERS })
		case 'rate_limited':
			return m.character_refresh_rate_limited()
		case 'invalid_characters':
			return m.character_refresh_invalid_characters()
		case 'unauthorized':
			return m.character_refresh_unauthorized()
		case 'not_found':
			return m.character_refresh_not_found()
		case 'not_previewed':
			return m.character_refresh_not_previewed()
		default:
			return m.character_refresh_error({ message: message || '—' })
	}
}

// ---- Batch -----------------------------------------------------------------

/** Batch statuses the job is still working through; the dialog keeps polling. */
export function isBatchWorking(status: RefreshBatchStatus): boolean {
	return status === 'queued' || status === 'running' || status === 'applying'
}

export function itemStatusLabel(status: RefreshItemStatus): string {
	switch (status) {
		case 'queued':
			return m.character_refresh_status_queued()
		case 'fetching':
			return m.character_refresh_status_fetching()
		case 'previewed':
			return m.character_refresh_status_previewed()
		case 'applying':
			return m.character_refresh_status_applying()
		case 'applied':
			return m.character_refresh_status_applied()
		case 'skipped':
			return m.character_refresh_status_skipped()
		default:
			return m.character_refresh_status_failed()
	}
}

/** One line per batch item: the change summary, or its error. */
export function itemSummary(item: RefreshBatchItem): string | null {
	if (item.error) return item.error
	if (!item.refresh) return null
	return refreshSummary(item.refresh)
}

/** What a refresh changes (or changed), in one line. */
export function refreshSummary(result: CharacterRefreshResult): string {
	switch (refreshOutcome(result)) {
		case 'changes': {
			const skills = new Set(result.changes.map((c) => `${c.kind}:${c.position}`)).size
			if (skills > 0) return m.character_refresh_summary_changes({ count: skills })
			return countRows(result.counts)
				.map((row) => `${row.label}: ${row.parts.join(', ')}`)
				.join('; ')
		}
		case 'text_only':
			return m.character_refresh_summary_text_only()
		default:
			return m.character_refresh_summary_none()
	}
}

/** Previewed items that would change something: ticked by default. */
export function defaultSelection(items: RefreshBatchItem[]): string[] {
	return items
		.filter((i) => i.status === 'previewed' && i.refresh && refreshOutcome(i.refresh) !== 'none')
		.map((i) => i.characterId)
}

export function isSelectable(item: RefreshBatchItem): boolean {
	return item.status === 'previewed' && !!item.refresh
}

/** Database page of a batch row: style rows live under /style. */
export function characterPath(item: Pick<RefreshBatchItem, 'granblueId' | 'styleSwap'>): string {
	return `/database/characters/${item.granblueId}${item.styleSwap ? '/style' : ''}`
}
