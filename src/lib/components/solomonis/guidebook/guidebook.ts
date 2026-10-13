/**
 * Pure helpers for a Solomonis run's guidebook: display order, names,
 * stacking rules and catalogue filtering. Kept free of Svelte so they can be
 * tested in node.
 */

import type {
	GuideEffect,
	GuideEffectRarity,
	GuideEffectTargetType,
	GuidebookEntry,
	GuidebookEntryInput,
	PartialLocalizedName
} from '$lib/types/api/solomonis'
import { getGuideEffectIcon } from '$lib/utils/images'

export type GuidebookLocale = 'en' | 'ja'

/** The game lists held effects in this order. */
export const RARITY_ORDER: readonly GuideEffectRarity[] = ['unique', 'rare', 'normal', 'cursed']

export const VALUE_PLACEHOLDER = '{value}'

/** Shown in place of `{value}` when the run didn't record one. */
export const MISSING_VALUE = '—'

// ============================================================================
// Names
// ============================================================================

/** The name in `locale`, falling back to the other language. */
export function guideEffectRawName(name: PartialLocalizedName, locale: GuidebookLocale): string {
	const other: GuidebookLocale = locale === 'en' ? 'ja' : 'en'
	return name[locale] || name[other] || ''
}

export function hasValuePlaceholder(effect: GuideEffect): boolean {
	return [effect.name.en, effect.name.ja].some((n) => n?.includes(VALUE_PLACEHOLDER))
}

/** The effect's name with `{value}` filled from the run's `displayValue`. */
export function formatGuideEffectName(
	effect: GuideEffect,
	displayValue: string | null,
	locale: GuidebookLocale
): string {
	const raw = guideEffectRawName(effect.name, locale)
	const value = displayValue?.trim() ? displayValue.trim() : MISSING_VALUE
	return raw.split(VALUE_PLACEHOLDER).join(value)
}

// ============================================================================
// Display order
// ============================================================================

export interface RarityGroup {
	rarity: GuideEffectRarity
	entries: GuidebookEntry[]
}

/** Non-empty rarity groups in the game's order, keeping list order inside each. */
export function groupByRarity(entries: GuidebookEntry[]): RarityGroup[] {
	return RARITY_ORDER.map((rarity) => ({
		rarity,
		entries: entries.filter((e) => e.effect.rarity === rarity)
	})).filter((g) => g.entries.length > 0)
}

export function hasAcquiredOrder(entries: GuidebookEntry[]): boolean {
	return entries.some((e) => e.acquiredOrder !== null)
}

/** Known pickup order first (ascending), then the rest in list order. */
export function sortByAcquiredOrder(entries: GuidebookEntry[]): GuidebookEntry[] {
	return entries
		.map((entry, index) => ({ entry, index }))
		.sort((a, b) => {
			const ao = a.entry.acquiredOrder
			const bo = b.entry.acquiredOrder
			if (ao !== null && bo !== null && ao !== bo) return ao - bo
			if (ao !== null && bo === null) return -1
			if (ao === null && bo !== null) return 1
			return a.index - b.index
		})
		.map(({ entry }) => entry)
}

// ============================================================================
// Editing (each returns a new list; the whole list is saved at once)
// ============================================================================

export function findEntry(entries: GuidebookEntry[], effectId: string): GuidebookEntry | undefined {
	return entries.find((e) => e.effect.id === effectId)
}

export function heldCount(entries: GuidebookEntry[], effectId: string): number {
	return findEntry(entries, effectId)?.count ?? 0
}

/** Whether adding `effect` would change the list. */
export function canAddEffect(entries: GuidebookEntry[], effect: GuideEffect): boolean {
	return effect.stackable || !findEntry(entries, effect.id)
}

/**
 * Adds an effect. Adding a stackable effect that's already held raises its
 * count; a non-stackable one stays at 1.
 */
export function addEffect(entries: GuidebookEntry[], effect: GuideEffect): GuidebookEntry[] {
	const existing = findEntry(entries, effect.id)
	if (existing) {
		if (!effect.stackable) return entries
		return entries.map((e) => (e === existing ? { ...e, count: e.count + 1 } : e))
	}
	return [
		...entries,
		{
			effect,
			count: 1,
			displayValue: null,
			acquiredOrder: null,
			inherited: false,
			note: null
		}
	]
}

export type GuidebookEntryPatch = Partial<
	Pick<GuidebookEntry, 'count' | 'displayValue' | 'acquiredOrder' | 'inherited' | 'note'>
>

function normalizeText(value: string | null | undefined): string | null {
	const trimmed = value?.trim()
	return trimmed ? trimmed : null
}

function normalizeCount(effect: GuideEffect, count: number): number {
	if (!effect.stackable) return 1
	if (!Number.isFinite(count)) return 1
	return Math.max(1, Math.floor(count))
}

function normalizeOrder(order: number | null): number | null {
	if (order === null || !Number.isFinite(order)) return null
	return Math.max(1, Math.floor(order))
}

/**
 * Applies a patch to one entry. Counts stay at least 1 (always 1 for
 * non-stackable effects), and marking an entry inherited clears the flag on
 * every other entry: a run inherits at most one effect.
 */
export function updateEntry(
	entries: GuidebookEntry[],
	effectId: string,
	patch: GuidebookEntryPatch
): GuidebookEntry[] {
	return entries.map((e) => {
		if (e.effect.id !== effectId) {
			return patch.inherited && e.inherited ? { ...e, inherited: false } : e
		}
		const next = { ...e, ...patch }
		return {
			...next,
			count: normalizeCount(e.effect, next.count),
			displayValue: normalizeText(next.displayValue),
			acquiredOrder: normalizeOrder(next.acquiredOrder),
			note: normalizeText(next.note)
		}
	})
}

export function removeEntry(entries: GuidebookEntry[], effectId: string): GuidebookEntry[] {
	return entries.filter((e) => e.effect.id !== effectId)
}

/** The `PUT /parties/:id/guide_effects` payload for a list. */
export function toGuidebookInput(entries: GuidebookEntry[]): GuidebookEntryInput[] {
	return entries.map((e) => ({
		guideEffectId: e.effect.id,
		count: e.count,
		displayValue: e.displayValue,
		acquiredOrder: e.acquiredOrder,
		inherited: e.inherited,
		note: e.note
	}))
}

// ============================================================================
// Catalogue search
// ============================================================================

/** `everyone` is effects with no target type. */
export type GuideEffectTargetFilter = 'all' | 'everyone' | GuideEffectTargetType

export interface GuideEffectFilters {
	query: string
	rarity: 'all' | GuideEffectRarity
	target: GuideEffectTargetFilter
	stackableOnly: boolean
	/** Wiki tags; an effect matches if it has any of them. Empty means no tag filter. */
	tags: string[]
}

export const DEFAULT_GUIDE_EFFECT_FILTERS: GuideEffectFilters = {
	query: '',
	rarity: 'all',
	target: 'all',
	stackableOnly: false,
	tags: []
}

/**
 * An effect's wiki tags (type and effect tags together), without duplicates.
 * Either list is null when the wiki had no match.
 */
export function guideEffectTags(effect: GuideEffect): string[] {
	return [...new Set([...(effect.typeTags ?? []), ...(effect.effectTags ?? [])])]
}

/** Every tag used in the catalogue, sorted, for the tag filter's options. */
export function collectGuideEffectTags(catalogue: GuideEffect[]): string[] {
	return [...new Set(catalogue.flatMap(guideEffectTags))].sort((a, b) => a.localeCompare(b))
}

/** Matching effects, ordered by rarity (game order) then game ID. */
export function filterGuideEffects(
	catalogue: GuideEffect[],
	filters: GuideEffectFilters
): GuideEffect[] {
	const terms = filters.query.trim().toLowerCase().split(/\s+/).filter(Boolean)

	return catalogue
		.filter((effect) => {
			if (filters.rarity !== 'all' && effect.rarity !== filters.rarity) return false
			if (filters.stackableOnly && !effect.stackable) return false
			if (filters.target === 'everyone' && effect.targetType !== null) return false
			if (
				filters.target !== 'all' &&
				filters.target !== 'everyone' &&
				effect.targetType !== filters.target
			)
				return false
			const tags = guideEffectTags(effect)
			if (filters.tags.length > 0 && !filters.tags.some((t) => tags.includes(t))) return false
			if (terms.length === 0) return true
			const haystack = [effect.name.en, effect.name.ja, ...tags]
				.filter(Boolean)
				.join(' ')
				.toLowerCase()
			return terms.every((t) => haystack.includes(t))
		})
		.sort(
			(a, b) =>
				RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) ||
				a.granblueId - b.granblueId
		)
}

// ============================================================================
// Icons
// ============================================================================

export type GuideEffectIconCategory = 'offence' | 'defence' | 'special' | 'cursed'

const ICON_CATEGORIES: Record<number, GuideEffectIconCategory> = {
	1: 'offence',
	2: 'defence',
	3: 'special',
	4: 'cursed'
}

/** The game's `icon_category`, as observed: 1 offence, 2 defence, 3 special, 4 cursed. */
export function guideEffectIconCategory(effect: GuideEffect): GuideEffectIconCategory {
	return ICON_CATEGORIES[effect.iconCategory] ?? (effect.rarity === 'cursed' ? 'cursed' : 'special')
}

/**
 * The effect's icon image, or null to show the category placeholder. The
 * game keys icons by `iconType` alone (`book_effect_<iconType>.png`); ours
 * are mirrored to the image bucket under the same number.
 */
export function guideEffectIconSrc(effect: GuideEffect): string | null {
	return effect.iconType > 0 ? getGuideEffectIcon(effect.iconType) : null
}
