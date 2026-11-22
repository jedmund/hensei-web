/**
 * Wonders: the rules every surface shares. Owned and party rows carry only
 * ids and state, so everything that needs a name, kind, element or category
 * joins against the catalogue here.
 *
 * - which Wonders apply to a team (its element, Unite and Fight);
 * - level caps from Seal evolution;
 * - the state a Wonder's kind allows, and its bonuses and image before the
 *   API has computed them (forms preview unsaved changes);
 * - the whole-set payload for `PUT /parties/:id/wonders`.
 *
 * @module features/wonders
 */

import type {
	OwnedWonder,
	PartyWonderInput,
	Wonder,
	WonderBonus,
	WonderCatalogue,
	WonderCategory,
	WonderState
} from '$lib/types/api/wonder'

// ============================================================================
// Teams
// ============================================================================

interface PartyLike {
	element?: number | null | undefined
	raid?: { group?: { contentMode?: string | null } | null | undefined } | null | undefined
}

/** A team is Unite and Fight when its raid's group is. */
export function isUniteAndFightParty(party: PartyLike): boolean {
	return party.raid?.group?.contentMode === 'unite_and_fight'
}

/** What decides whether a Wonder shows on a team. */
export interface WonderTeamContext {
	/** The team's element; without one, only all-element Wonders show */
	element?: number | null | undefined
	uniteAndFight: boolean
}

export function teamContext(party: PartyLike): WonderTeamContext {
	return { element: party.element ?? null, uniteAndFight: isUniteAndFightParty(party) }
}

/** Hidden by the team's content mode: Seals on Unite and Fight teams. Silent, no note. */
export function hiddenByContentMode(wonder: Wonder, context: WonderTeamContext): boolean {
	return context.uniteAndFight && wonder.hiddenInUniteAndFight
}

/**
 * Whether a team shows a Wonder: its element is null (every element) or the
 * team's, and its content mode doesn't hide it. Element 0 is the Null
 * element, not "every element", so compare with null.
 */
export function appliesToTeam(wonder: Wonder, context: WonderTeamContext): boolean {
	if (hiddenByContentMode(wonder, context)) return false
	return wonder.element == null || wonder.element === context.element
}

/**
 * Whether the edit pane offers a Wonder: battle-relevant and not hidden by
 * the content mode. Every element is offered, since teams change element
 * after they're made.
 */
export function editableOnTeam(wonder: Wonder, context: WonderTeamContext): boolean {
	return wonder.battleRelevant && !hiddenByContentMode(wonder, context)
}

// ============================================================================
// Catalogue joins
// ============================================================================

export interface JoinedWonder<Row extends OwnedWonder = OwnedWonder> {
	row: Row
	wonder: Wonder
}

/** Catalogue order: category, then the Wonder's own order. */
export function compareCatalogueOrder(catalogue: WonderCatalogue) {
	const categoryOrder = new Map(catalogue.categories.map((c) => [c.id, c.sortOrder]))
	return (a: Wonder, b: Wonder) =>
		(categoryOrder.get(a.categoryId) ?? Infinity) - (categoryOrder.get(b.categoryId) ?? Infinity) ||
		a.sortOrder - b.sortOrder
}

/** Pairs rows with their catalogue Wonder, in catalogue order. Unknown rows are dropped. */
export function joinWonders<Row extends OwnedWonder>(
	rows: readonly Row[],
	catalogue: WonderCatalogue
): JoinedWonder<Row>[] {
	const byId = new Map(catalogue.wonders.map((w) => [w.id, w]))
	const compare = compareCatalogueOrder(catalogue)
	return rows
		.flatMap((row) => {
			const wonder = byId.get(row.wonderId)
			return wonder ? [{ row, wonder }] : []
		})
		.sort((a, b) => compare(a.wonder, b.wonder))
}

/** A team's Wonders that apply to it, in catalogue order. */
export function visiblePartyWonders(
	party: PartyLike & { wonders?: OwnedWonder[] | undefined },
	catalogue: WonderCatalogue
): JoinedWonder[] {
	const context = teamContext(party)
	return joinWonders(party.wonders ?? [], catalogue).filter((j) => appliesToTeam(j.wonder, context))
}

export interface WonderGroup<T> {
	category: WonderCategory
	items: T[]
}

/** Groups items by their Wonder's category, in category order. Empty categories are left out. */
export function groupByCategory<T>(
	items: readonly T[],
	wonderOf: (item: T) => Wonder,
	catalogue: WonderCatalogue
): WonderGroup<T>[] {
	return [...catalogue.categories]
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((category) => ({
			category,
			items: items.filter((item) => wonderOf(item).categoryId === category.id)
		}))
		.filter((group) => group.items.length > 0)
}

// ============================================================================
// Levels and state
// ============================================================================

/** The highest level a Wonder can be at this evolution (Seals: 0→10, 1→15, 2→18, 3→20). */
export function maxLevelFor(wonder: Wonder, evolution: number | null | undefined): number {
	const cap = wonder.evolutionCaps.find((c) => c.evolution === (evolution ?? 0))
	if (cap) return cap.maxLevel
	return Math.max(1, wonder.maxLevel ?? 1)
}

export function maxEvolutionFor(wonder: Wonder): number {
	return Math.max(0, wonder.maxEvolution ?? 0)
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value))
}

/**
 * The state a Wonder's kind allows: level and evolution for leveled ones
 * (the level clamped to the evolution's cap), possession for scaling ones,
 * nothing for fixed ones.
 */
export function normalizeState(wonder: Wonder, state: Partial<WonderState>): WonderState {
	if (wonder.kind === 'leveled') {
		const evolution = clamp(Math.round(state.evolution ?? 0), 0, maxEvolutionFor(wonder))
		const level = clamp(Math.round(state.level ?? 1), 1, maxLevelFor(wonder, evolution))
		return { level, evolution, possession: null }
	}
	if (wonder.kind === 'scaling') {
		return {
			level: null,
			evolution: null,
			possession: Math.max(0, Math.round(state.possession ?? 0))
		}
	}
	return { level: null, evolution: null, possession: null }
}

/** A new Wonder's state: fully uncapped and at its highest level, the common case. */
export function defaultState(wonder: Wonder): WonderState {
	const evolution = maxEvolutionFor(wonder)
	return normalizeState(wonder, { evolution, level: maxLevelFor(wonder, evolution), possession: 0 })
}

/** Reads a row's state for a form. */
export function stateOf(wonder: Wonder, row: Partial<WonderState> | null | undefined): WonderState {
	return row ? normalizeState(wonder, row) : defaultState(wonder)
}

// ============================================================================
// Bonuses
// ============================================================================

/**
 * Symbolum Amicitiae's DMG Amplify from the recruited count: 0.5 at 300,
 * 1.0 at 600, then +0.1 per 10 above 600, capped at 5. In tenths, so the
 * sum is exact.
 */
export function symbolumBonus(possession: number | null | undefined): number {
	const n = Math.max(0, Math.floor(possession ?? 0))
	if (n < 300) return 0
	if (n < 600) return 0.5
	const tenths = Math.min(50, 10 + Math.floor((n - 600) / 10))
	return tenths / 10
}

/**
 * Recruits until Symbolum's next boost (the game's `next_upgrade` minus the
 * count): to 300, to 600, then to the next 10. Null once capped at 1000.
 */
export function symbolumRecruitsUntilNext(possession: number | null | undefined): number | null {
	const n = Math.max(0, Math.floor(possession ?? 0))
	if (n < 300) return 300 - n
	if (n < 600) return 600 - n
	if (n >= 1000) return null
	return 600 + (Math.floor((n - 600) / 10) + 1) * 10 - n
}

/** Rounds away float noise (0.1 + 0.2) so sums show as the game shows them. */
function tidy(value: number): number {
	return Math.round(value * 100) / 100
}

/**
 * A Wonder's bonuses for a state, as the API computes them: leveled sums
 * the per-level additions up to the level, grouped by stat in first-
 * appearance order; scaling gives DMG Amplify; fixed gives none.
 */
export function computeBonuses(wonder: Wonder, state: WonderState): WonderBonus[] {
	if (wonder.kind === 'scaling') {
		return [{ stat: 'dmg_amplify', value: symbolumBonus(state.possession) }]
	}
	if (wonder.kind !== 'leveled') return []

	const level = state.level ?? 0
	const totals = new Map<WonderBonus['stat'], number>()
	for (const bonus of [...wonder.levelBonuses].sort((a, b) => a.level - b.level)) {
		if (bonus.level > level) break
		totals.set(bonus.stat, (totals.get(bonus.stat) ?? 0) + bonus.value)
	}
	return [...totals].map(([stat, value]) => ({ stat, value: tidy(value) }))
}

/** A bonus value without float noise or trailing zeros: 4 → "4", 0.5 → "0.5". */
export function formatBonusNumber(value: number): string {
	return String(tidy(value))
}

/**
 * The image for a state: `<granblue_id>_<level>` for leveled Wonders, the
 * stored image for scaling ones (the import's variant), the id otherwise.
 */
export function wonderImageName(
	wonder: Wonder,
	state: WonderState,
	storedImage?: string | null
): string {
	if (wonder.kind === 'leveled' && state.level != null) return `${wonder.granblueId}_${state.level}`
	if (wonder.kind === 'scaling' && storedImage) return storedImage
	return wonder.granblueId
}

// ============================================================================
// Party payload
// ============================================================================

/**
 * The whole set for `PUT /parties/:id/wonders`. The pane edits only the
 * Wonders that apply to the team; the rest (another element's, or Seals on
 * a Unite and Fight team) are kept as they were, since the snapshot keeps
 * them and the endpoint replaces the set.
 *
 * @param existing - the party's current Wonders
 * @param editable - ids of the Wonders the pane shows
 * @param selection - the pane's turned-on Wonders, by Wonder id
 */
export function partyWondersPayload(
	existing: readonly OwnedWonder[],
	editable: readonly Wonder[],
	selection: Readonly<Record<string, WonderState>>
): PartyWonderInput[] {
	const editableIds = new Set(editable.map((w) => w.id))
	const kept = existing
		.filter((row) => !editableIds.has(row.wonderId))
		.map((row) => ({
			wonderId: row.wonderId,
			level: row.level,
			evolution: row.evolution,
			possession: row.possession
		}))
	const edited = editable
		.filter((wonder) => selection[wonder.id])
		.map((wonder) => ({ wonderId: wonder.id, ...normalizeState(wonder, selection[wonder.id]!) }))
	return [...kept, ...edited]
}

/** The pane's starting selection: the party's Wonders among those it shows. */
export function selectionFromParty(
	existing: readonly OwnedWonder[],
	editable: readonly Wonder[]
): Record<string, WonderState> {
	const rows = new Map(existing.map((row) => [row.wonderId, row]))
	const selection: Record<string, WonderState> = {}
	for (const wonder of editable) {
		const row = rows.get(wonder.id)
		if (row) selection[wonder.id] = stateOf(wonder, row)
	}
	return selection
}

export function sameSelection(
	a: Readonly<Record<string, WonderState>>,
	b: Readonly<Record<string, WonderState>>
): boolean {
	const keys = Object.keys(a)
	if (keys.length !== Object.keys(b).length) return false
	return keys.every((key) => {
		const x = a[key]
		const y = b[key]
		return (
			!!y && x!.level === y.level && x!.evolution === y.evolution && x!.possession === y.possession
		)
	})
}
