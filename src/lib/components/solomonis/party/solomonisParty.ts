/**
 * Pure helpers behind the Solomonis party panel and blessing picker.
 * Kept out of the components so they can be unit tested in node.
 */

import { extractErrorMessage } from '$lib/utils/errors'
import type { Party } from '$lib/types/api/party'
import type {
	ArcarumBlessing,
	ArcarumBlessingLevel,
	PartialLocalizedName,
	PartyBlessing,
	RouteEvoker,
	SolomonisExpedition,
	SolomonisStats,
	SolomonisSummary
} from '$lib/types/api/solomonis'

/** The loadout limit when the catalogue hasn't loaded yet. The API's value wins. */
export const DEFAULT_BLESSING_COST_LIMIT = 100
export const MAX_PLEDGE_LEVEL = 5

/** True when `solomonis` is the full-view expedition rather than a list summary. */
export function isFullExpedition(
	solomonis: SolomonisExpedition | SolomonisSummary | null | undefined
): solomonis is SolomonisExpedition {
	return !!solomonis && 'routeEvoker' in solomonis
}

/** A party is a Solomonis party when its raid's group is in the Solomonis content mode. */
export function isSolomonisParty(party: Pick<Party, 'raid' | 'solomonis'>): boolean {
	return party.raid?.group?.contentMode === 'solomonis' || !!party.solomonis
}

/**
 * Name in the given locale, falling back to the other language. Japanese text
 * for the mode is often missing (decision D2), and an effect may be known only
 * in Japanese.
 */
export function solomonisName(
	name: PartialLocalizedName | null | undefined,
	locale: 'en' | 'ja'
): string {
	if (!name) return '—'
	const other = locale === 'en' ? 'ja' : 'en'
	return name[locale] || name[other] || '—'
}

/** Formats an ISO timestamp in JST (the game's time zone), e.g. "2026-10-11 16:38". */
export function formatJst(iso: string | null | undefined): string | null {
	if (!iso) return null
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return null
	const jst = new Date(date.getTime() + 9 * 60 * 60 * 1000)
	const pad = (n: number) => String(n).padStart(2, '0')
	return (
		`${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())} ` +
		`${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`
	)
}

export const SPACE_STAT_KEYS = [
	'battle',
	'strong',
	'terrifying',
	'ruler',
	'boss',
	'event',
	'healing',
	'chest',
	'teleporter',
	'special'
] as const satisfies readonly (keyof SolomonisStats)[]

export type SpaceStatKey = (typeof SPACE_STAT_KEYS)[number]

/** Spaces visited, in display order, skipping keys the report didn't include. */
export function spaceStats(stats: SolomonisStats): { key: SpaceStatKey; count: number }[] {
	return SPACE_STAT_KEYS.flatMap((key) => {
		const count = stats[key]
		return typeof count === 'number' ? [{ key, count }] : []
	})
}

export function totalSpaces(stats: SolomonisStats): number {
	return spaceStats(stats).reduce((sum, s) => sum + s.count, 0)
}

export function hasStats(stats: SolomonisStats | null | undefined): boolean {
	return !!stats && Object.values(stats).some((v) => typeof v === 'number')
}

/**
 * The details pane's guidebook section: always for editors, so an empty
 * guidebook still offers Add (and removing the last effect doesn't unmount
 * the section mid-save); for viewers only when there's something to show.
 */
export function showGuidebookSection(expedition: SolomonisExpedition, canWrite: boolean): boolean {
	return canWrite || expedition.guidebook.length > 0
}

// ---------------------------------------------------------------------------
// Blessings
// ---------------------------------------------------------------------------

/** Picker selection: blessing id → level id. */
export type BlessingSelection = Record<string, string>

export function selectionFromParty(blessings: PartyBlessing[]): BlessingSelection {
	return Object.fromEntries(blessings.map((b) => [b.blessing.id, b.levelId]))
}

export function findLevel(
	catalogue: ArcarumBlessing[],
	blessingId: string,
	levelId: string
): ArcarumBlessingLevel | undefined {
	return catalogue.find((b) => b.id === blessingId)?.levels.find((l) => l.id === levelId)
}

export function selectionCost(catalogue: ArcarumBlessing[], selection: BlessingSelection): number {
	return Object.entries(selection).reduce(
		(sum, [blessingId, levelId]) => sum + (findLevel(catalogue, blessingId, levelId)?.cost ?? 0),
		0
	)
}

/** Released blessings in arcana order: the only ones a party can equip. */
export function releasedBlessings(catalogue: ArcarumBlessing[]): ArcarumBlessing[] {
	return catalogue.filter((b) => b.released).sort((a, b) => a.arcanaNumber - b.arcanaNumber)
}

/** Level ids to send, in arcana order. Drops anything not in the released catalogue. */
export function selectionToLevelIds(
	catalogue: ArcarumBlessing[],
	selection: BlessingSelection
): string[] {
	return releasedBlessings(catalogue).flatMap((b) => {
		const levelId = selection[b.id]
		return levelId && b.levels.some((l) => l.id === levelId) ? [levelId] : []
	})
}

export function sameSelection(a: BlessingSelection, b: BlessingSelection): boolean {
	const keys = new Set([...Object.keys(a), ...Object.keys(b)])
	return [...keys].every((k) => a[k] === b[k])
}

// ---------------------------------------------------------------------------
// Route Evoker
// ---------------------------------------------------------------------------

/**
 * Route-eligible Evokers in the party's character grid. The PRD fills the
 * route in automatically when exactly one is there.
 */
export function evokersInGrid(
	party: Pick<Party, 'characters'>,
	routeEvokers: RouteEvoker[]
): RouteEvoker[] {
	const ids = new Set((party.characters ?? []).map((c) => c.character?.id).filter(Boolean))
	return routeEvokers.filter((e) => ids.has(e.id))
}

/** The route to preselect: the current one, else the only eligible Evoker in the grid. */
export function defaultRouteEvokerId(
	party: Pick<Party, 'characters' | 'solomonis'>,
	routeEvokers: RouteEvoker[]
): string | null {
	if (isFullExpedition(party.solomonis)) return party.solomonis.routeEvoker.id
	const inGrid = evokersInGrid(party, routeEvokers)
	return inGrid.length === 1 ? inGrid[0]!.id : null
}

/** Completeness flag: the route Evoker should also be in the character grid. */
export function routeEvokerMissingFromGrid(
	party: Pick<Party, 'characters' | 'solomonis'>
): boolean {
	if (!isFullExpedition(party.solomonis)) return false
	const routeId = party.solomonis.routeEvoker.id
	return !(party.characters ?? []).some((c) => c.character?.id === routeId)
}

// ---------------------------------------------------------------------------
// Raid changes
// ---------------------------------------------------------------------------

/**
 * What picking `raid` means for a party (D12):
 * - `enter`: a Solomonis zone for a party outside the mode. The route Evoker
 *   decides the zone, so the web app opens the route picker instead.
 * - `leave`: a non-Solomonis raid (or none) for a Solomonis party. The API
 *   deletes its Solomonis data, so the web app confirms first.
 * - `none`: an ordinary raid change.
 * Moving between Solomonis zones is `none`: the API rejects a zone that
 * doesn't match the route Evoker.
 */
export type SolomonisRaidTransition = 'enter' | 'leave' | 'none'

export function solomonisRaidTransition(
	partyIsSolomonis: boolean,
	raid: { group?: { contentMode?: string | null } | undefined } | null | undefined
): SolomonisRaidTransition {
	const toSolomonis = raid?.group?.contentMode === 'solomonis'
	if (toSolomonis && !partyIsSolomonis) return 'enter'
	if (!toSolomonis && partyIsSolomonis) return 'leave'
	return 'none'
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Like `extractErrorMessage`, but the API keys expedition errors
 * `solomonis.<field>` (e.g. `solomonis.route_evoker_id`), which would read as
 * "Solomonis.Route Evoker Id …". Drop the prefix first.
 */
export function solomonisErrorMessage(error: unknown, fallback: string): string {
	return extractErrorMessage(stripSolomonisErrorKeys(error), fallback)
}

function stripSolomonisErrorKeys(value: unknown): unknown {
	if (!value || typeof value !== 'object' || Array.isArray(value)) return value
	const result: Record<string, unknown> = {}
	for (const [key, inner] of Object.entries(value)) {
		if (key === 'errors' && inner && typeof inner === 'object' && !Array.isArray(inner)) {
			result.errors = Object.fromEntries(
				Object.entries(inner).map(([k, v]) => [k.replace(/^solomonis\./, ''), v])
			)
		} else if (key === 'details') {
			result.details = stripSolomonisErrorKeys(inner)
		} else {
			result[key] = inner
		}
	}
	return result
}
