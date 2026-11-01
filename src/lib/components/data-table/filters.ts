/**
 * Filter controls for DataTable, described as config so each list (weapons,
 * characters, summons…) declares its filters instead of building markup.
 *
 * Every filter reads and writes the table URL (see urlState.ts), so filters
 * are shareable, survive reload and send the table back to page 1. Pass the
 * same config to `createTableUrl({ filters: filterSpecs(config) })` and to
 * DataTable's `filters` prop.
 *
 * Kinds:
 * - `multi`: a multi-select (`?element=1,2`). With `facet: true` the options
 *   show the server's facet counts for that key.
 * - `toggles`: a group of boolean filters in one menu (`?flb=true&ulb=true`).
 *   Only "on" is offered; turning one off removes it.
 * - `recent`: "changed in the last N days" presets on a range filter
 *   (`?updated_at=2026-10-24..`).
 *
 * Values are strings throughout: the URL codec and facet keys are strings.
 */
import type { FilterSpec, FilterValue, RangeValue } from './urlState'

type Label = string | (() => string)

export interface FilterOption {
	value: string
	label: Label
	image?: string | undefined
	/** Check indicator colour, e.g. the element colour */
	indicatorColor?: string | undefined
	/** Facet key for the count, when it differs from `value` (e.g. slug vs UUID) */
	facetKey?: string | undefined
}

export interface MultiFilterConfig {
	kind: 'multi'
	key: string
	label: Label
	/** A function so labels follow the locale and async option lists */
	options: () => FilterOption[]
	/** Show counts from `source.facets[key]` (request the facet on the source) */
	facet?: boolean
}

export interface ToggleConfig {
	key: string
	label: Label
}

export interface ToggleGroupConfig {
	kind: 'toggles'
	/** Stable id for the group (keys come from the toggles) */
	id: string
	label: Label
	toggles: ToggleConfig[]
}

export interface RecentPreset {
	days: number
	label: Label
}

export interface RecentFilterConfig {
	kind: 'recent'
	key: string
	label: Label
	presets: RecentPreset[]
}

export type FilterConfig = MultiFilterConfig | ToggleGroupConfig | RecentFilterConfig

/** An option ready for MultiSelect */
export interface ResolvedOption {
	value: string
	label: string
	image?: string
	indicatorColor?: string
	count?: number
	disabled?: boolean
}

export function labelText(label: Label): string {
	return typeof label === 'function' ? label() : label
}

/** URL codec specs for a filter config */
export function filterSpecs(config: FilterConfig[]): FilterSpec[] {
	return config.flatMap((filter): FilterSpec[] => {
		switch (filter.kind) {
			case 'multi':
				return [{ key: filter.key, kind: 'multi' }]
			case 'toggles':
				return filter.toggles.map((toggle) => ({ key: toggle.key, kind: 'boolean' as const }))
			case 'recent':
				return [{ key: filter.key, kind: 'range' }]
		}
	})
}

/** Facets to request from a server source */
export function facetKeys(config: FilterConfig[]): string[] {
	return config.flatMap((filter) => (filter.kind === 'multi' && filter.facet ? [filter.key] : []))
}

export function multiValue(filters: Record<string, FilterValue>, key: string): string[] {
	const value = filters[key]
	return Array.isArray(value) ? value : []
}

/**
 * Options with their facet counts. Before facets arrive there are no counts.
 * Options with no matches are disabled unless selected (so they can be
 * cleared). Selected values the options don't know (e.g. a hand-typed URL)
 * are kept so they can still be removed.
 */
export function resolveOptions(
	options: FilterOption[],
	counts: Record<string, number> | undefined,
	selected: string[]
): ResolvedOption[] {
	const resolved = options.map((option): ResolvedOption => {
		const result: ResolvedOption = { value: option.value, label: labelText(option.label) }
		if (option.image) result.image = option.image
		if (option.indicatorColor) result.indicatorColor = option.indicatorColor
		if (counts) {
			const count = counts[option.facetKey ?? option.value] ?? 0
			result.count = count
			if (count === 0 && !selected.includes(option.value)) result.disabled = true
		}
		return result
	})
	const known = new Set(options.map((o) => o.value))
	for (const value of selected) {
		if (!known.has(value)) resolved.push({ value, label: value })
	}
	return resolved
}

/** Trigger text: the label alone, the one selected option, or the label with a count */
export function multiTriggerText(
	label: string,
	options: ResolvedOption[],
	selected: string[],
	formatCount: (label: string, count: number) => string
): string {
	if (selected.length === 0) return label
	if (selected.length === 1) {
		return options.find((o) => o.value === selected[0])?.label ?? selected[0]!
	}
	return formatCount(label, selected.length)
}

/** Keys of the group's toggles that are on */
export function toggleValue(
	filters: Record<string, FilterValue>,
	group: ToggleGroupConfig
): string[] {
	return group.toggles.filter((t) => filters[t.key] === true).map((t) => t.key)
}

/** Filters with the group's toggles set to exactly `on` */
export function applyToggles(
	filters: Record<string, FilterValue>,
	group: ToggleGroupConfig,
	on: string[]
): Record<string, FilterValue> {
	const next = { ...filters }
	for (const toggle of group.toggles) {
		if (on.includes(toggle.key)) next[toggle.key] = true
		else delete next[toggle.key]
	}
	return next
}

/** Filters with `key` set, or removed when the value is empty */
export function applyMulti(
	filters: Record<string, FilterValue>,
	key: string,
	values: string[]
): Record<string, FilterValue> {
	const next = { ...filters }
	if (values.length > 0) next[key] = values
	else delete next[key]
	return next
}

/** Local calendar date as YYYY-MM-DD */
export function isoDate(date: Date): string {
	const y = date.getFullYear()
	const m = String(date.getMonth() + 1).padStart(2, '0')
	const d = String(date.getDate()).padStart(2, '0')
	return `${y}-${m}-${d}`
}

/** The range for "in the last `days` days": from that date on, open-ended */
export function recentRange(days: number, today: Date = new Date()): RangeValue {
	const from = new Date(today)
	from.setDate(from.getDate() - days)
	return { gte: isoDate(from) }
}

/**
 * Which preset the URL's range matches today: its `days`, `'custom'` for any
 * other range (including a preset picked on an earlier day), or null when unset.
 */
export function matchRecent(
	value: FilterValue | undefined,
	presets: RecentPreset[],
	today: Date = new Date()
): number | 'custom' | null {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return null
	if (!value.gte && !value.lte) return null
	if (!value.lte) {
		const preset = presets.find((p) => recentRange(p.days, today).gte === value.gte)
		if (preset) return preset.days
	}
	return 'custom'
}

/** Filters with the recent preset applied (null clears it) */
export function applyRecent(
	filters: Record<string, FilterValue>,
	key: string,
	days: number | null,
	today: Date = new Date()
): Record<string, FilterValue> {
	const next = { ...filters }
	if (days === null) delete next[key]
	else next[key] = recentRange(days, today)
	return next
}

/** Active filters among the config's keys (each toggle counts once) */
export function activeFilterCount(
	filters: Record<string, FilterValue>,
	config: FilterConfig[]
): number {
	return filterSpecs(config).filter((spec) => filters[spec.key] !== undefined).length
}
