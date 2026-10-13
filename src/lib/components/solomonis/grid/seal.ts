/**
 * Evoking Solomonis grid rules: which slots start unsealed, how a slot is
 * displayed, character limits, and the party's unseal priority list.
 *
 * See docs/prds/evoking-solomonis-prd.md ("Seal state", "Unseal priority",
 * "Characters"). Everything here is pure so it can be tested without a DOM.
 */
import type { Party, GridCharacter, GridSummon, GridWeapon } from '$lib/types/api/party'
import type {
	SealState,
	SolomonisExpedition,
	SolomonisSummary,
	UnsealPriorityItem
} from '$lib/types/api/solomonis'

export type SealItemType = UnsealPriorityItem['type']

/** Blessing slugs the grid cares about (decisions.md D3). */
export const JUSTICE = 'justice'
export const HANGED_MAN = 'hanged_man'

/** Positions of the support summon, which Solomonis parties don't have. */
export const FRIEND_SUMMON_POSITION = 6

/**
 * Characters a Solomonis party can hold: the route Evoker plus up to 4
 * recruits. The Hanged Man's ally takes one of the 4.
 */
export const SOLOMONIS_CHARACTER_LIMIT = 5

/**
 * `party.solomonis` is the full expedition on the party page and a summary in
 * list views. Grids only ever see the full view.
 */
export function isSolomonisExpedition(
	value: SolomonisExpedition | SolomonisSummary | null | undefined
): value is SolomonisExpedition {
	return !!value && 'blessings' in value && Array.isArray(value.blessings)
}

export function getExpedition(party: Party | null | undefined): SolomonisExpedition | null {
	const value = party?.solomonis
	return isSolomonisExpedition(value) ? value : null
}

export function hasBlessing(expedition: SolomonisExpedition | null, slug: string): boolean {
	return !!expedition?.blessings.some((b) => b.blessing.slug === slug)
}

/**
 * Starting slots are fixed by position: the mainhand and weapon positions 0
 * and 1 (plus 2 with Justice), and the main summon.
 */
export function isStartingSlot(type: SealItemType, position: number, hasJustice: boolean): boolean {
	if (type === 'summon') return position === -1
	return position === -1 || position === 0 || position === 1 || (hasJustice && position === 2)
}

export interface SlotSeal {
	/** What to show. `null` means unknown (not recorded yet). */
	state: SealState | null
	/** Fixed starting slot: marked, never has a control. */
	starting: boolean
	/** Render the item dimmed. */
	dimmed: boolean
	/** The user can pick unsealed/sealed. */
	editable: boolean
	/** Rank in the unseal priority list (sealed slots only). */
	priority: number | null
}

/**
 * How a weapon or summon slot is shown on a Solomonis party.
 *
 * Starting slots follow from position and blessings, so a blessing change
 * shows up before the API recomputes the grid. Every other slot keeps what
 * the user (or an import) recorded; a `start` left on a slot that is no
 * longer a starting one reads as unknown. Only sealed slots carry a priority.
 */
export function slotSeal(
	expedition: SolomonisExpedition,
	type: SealItemType,
	position: number,
	item: Pick<GridWeapon, 'sealState' | 'unsealPriority'> | undefined
): SlotSeal {
	const starting = isStartingSlot(type, position, hasBlessing(expedition, JUSTICE))

	if (starting) {
		return { state: 'start', starting, dimmed: false, editable: false, priority: null }
	}

	const recorded = item?.sealState ?? null
	const state = recorded === 'start' ? null : recorded
	return {
		state,
		starting,
		dimmed: !!item && state === 'sealed',
		editable: !!item,
		priority: state === 'sealed' ? (item?.unsealPriority ?? null) : null
	}
}

/**
 * Number of character slots to render: the limit, or more when the party
 * already holds characters past it, so nothing is hidden.
 */
export function characterSlotCount(characters: Pick<GridCharacter, 'position'>[]): number {
	const highest = characters.reduce((max, c) => Math.max(max, c.position), -1)
	return Math.max(SOLOMONIS_CHARACTER_LIMIT, highest + 1)
}

export function isRouteEvoker(
	expedition: SolomonisExpedition,
	character: GridCharacter | undefined
): boolean {
	return !!character && character.character?.id === expedition.routeEvoker.id
}

/**
 * With The Hanged Man, one ally (not the route Evoker) can be marked as
 * brought by the blessing. Returns whether `character` may toggle it.
 */
export function canMarkBroughtByBlessing(
	expedition: SolomonisExpedition,
	characters: GridCharacter[],
	character: GridCharacter | undefined
): boolean {
	if (!character) return false
	if (!hasBlessing(expedition, HANGED_MAN)) return false
	if (isRouteEvoker(expedition, character)) return false
	if (character.broughtByBlessing) return true
	return !characters.some((c) => c.id !== character.id && c.broughtByBlessing)
}

// Unseal priority

export interface PriorityEntry {
	type: SealItemType
	id: string
	position: number
	item: GridWeapon | GridSummon
}

/** Stable key for an entry, since weapon and summon IDs share one list. */
export function entryKey(entry: Pick<PriorityEntry, 'type' | 'id'>): string {
	return `${entry.type}:${entry.id}`
}

/** Weapons first, then summons, each by position. */
function byPosition(a: PriorityEntry, b: PriorityEntry): number {
	return a.type === b.type ? a.position - b.position : a.type === 'weapon' ? -1 : 1
}

/**
 * The party's sealed weapons and summons, split into the ranked list (by
 * priority) and the rest (weapons first, then summons, by position).
 */
export function priorityLists(party: Party): {
	ranked: PriorityEntry[]
	unranked: PriorityEntry[]
} {
	const expedition = getExpedition(party)
	if (!expedition) return { ranked: [], unranked: [] }

	const sealed: { entry: PriorityEntry; priority: number | null }[] = []
	const collect = (type: SealItemType, items: (GridWeapon | GridSummon)[] | undefined) => {
		for (const item of items ?? []) {
			if (type === 'summon' && item.position === FRIEND_SUMMON_POSITION) continue
			const seal = slotSeal(expedition, type, item.position, item)
			if (seal.state !== 'sealed') continue
			sealed.push({
				entry: { type, id: item.id, position: item.position, item },
				priority: seal.priority
			})
		}
	}
	collect('weapon', party.weapons)
	collect('summon', party.summons)

	const ranked = sealed
		.filter((e) => e.priority != null)
		.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
		.map((e) => e.entry)
	const unranked = sealed
		.filter((e) => e.priority == null)
		.map((e) => e.entry)
		.sort(byPosition)
	return { ranked, unranked }
}

/**
 * Moves `key` into the ranked list at `index` (clamped). Works for entries
 * coming from either list, and for reordering within the ranked list.
 */
export function rankAt(
	ranked: PriorityEntry[],
	unranked: PriorityEntry[],
	key: string,
	index: number
): { ranked: PriorityEntry[]; unranked: PriorityEntry[] } {
	const entry = ranked.find((e) => entryKey(e) === key) ?? unranked.find((e) => entryKey(e) === key)
	if (!entry) return { ranked, unranked }

	const nextRanked = ranked.filter((e) => entryKey(e) !== key)
	const target = Math.max(0, Math.min(index, nextRanked.length))
	nextRanked.splice(target, 0, entry)
	return { ranked: nextRanked, unranked: unranked.filter((e) => entryKey(e) !== key) }
}

/** Takes `key` out of the ranked list and puts it back among the unranked. */
export function unrank(
	ranked: PriorityEntry[],
	unranked: PriorityEntry[],
	key: string
): { ranked: PriorityEntry[]; unranked: PriorityEntry[] } {
	const entry = ranked.find((e) => entryKey(e) === key)
	if (!entry) return { ranked, unranked }
	const nextUnranked = [...unranked, entry].sort(byPosition)
	return { ranked: ranked.filter((e) => entryKey(e) !== key), unranked: nextUnranked }
}

export function toPriorityPayload(ranked: PriorityEntry[]): UnsealPriorityItem[] {
	return ranked.map(({ type, id }) => ({ type, id }))
}

/** Applies a saved ranked list to the party's grid items (1-based, others null). */
export function applyPriorities(party: Party, items: UnsealPriorityItem[]): Party {
	const rank = new Map(items.map((item, i) => [`${item.type}:${item.id}`, i + 1]))
	return {
		...party,
		weapons: party.weapons.map((w) => ({
			...w,
			unsealPriority: rank.get(`weapon:${w.id}`) ?? null
		})),
		summons: party.summons.map((s) => ({
			...s,
			unsealPriority: rank.get(`summon:${s.id}`) ?? null
		}))
	}
}

const CIRCLED = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳'

/** ①②③… for the badge; plain digits past 20. */
export function circledNumber(n: number): string {
	return n >= 1 && n <= CIRCLED.length ? (CIRCLED[n - 1] ?? String(n)) : String(n)
}
