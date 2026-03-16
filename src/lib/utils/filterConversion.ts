import type { FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
import type { ExploreFilterParams } from '$lib/api/adapters/party.adapter'

/**
 * Converts an array of FilterItems (from ExploreFilters) into
 * the query params shape the parties API expects.
 */
export function filterItemsToParams(filterItems: FilterItem[]): ExploreFilterParams {
	const params: ExploreFilterParams = {}

	// Elements (multiple allowed)
	const elements = filterItems
		.filter((f): f is FilterItem & { kind: 'element' } => f.kind === 'element')
		.map((f) => f.value)
	if (elements.length > 0) params.element = elements

	// Raid (single)
	const raid = filterItems.find((f) => f.kind === 'raid')
	if (raid) params.raid = raid.value as string

	// Recency (single)
	const recency = filterItems.find((f) => f.kind === 'recency')
	if (recency) params.recency = recency.value as number

	// Job/Class
	const job = filterItems.find((f) => f.kind === 'class')
	if (job) params.job = job.value as string

	// Party settings
	for (const f of filterItems.filter((f) => f.kind === 'party')) {
		const val = f.value as string
		if (val === 'full_auto') params.fullAuto = 1
		else if (val === 'solo') params.solo = 1
		else if (val === 'auto_guard') params.autoGuard = 1
		else if (val === 'charge_attack') params.chargeAttack = 1
		else if (val === 'youtube') params.hasVideo = true
	}

	// Boost mod (single-select)
	const boost = filterItems.find((f) => f.kind === 'boost')
	if (boost) params.boostMod = boost.value as string

	// Boost side (single-select)
	const side = filterItems.find((f) => f.kind === 'side')
	if (side) params.boostSide = side.value as string

	// Entity includes/excludes — API expects comma-separated granblue_id values
	const entities = filterItems.filter(
		(f): f is FilterItem & { kind: 'entity' } => f.kind === 'entity'
	)
	const includeIds = entities
		.filter((f) => f.mode === 'include')
		.map((f) => f.granblueId)
	const excludeIds = entities
		.filter((f) => f.mode === 'exclude')
		.map((f) => f.granblueId)
	if (includeIds.length > 0) params.includes = includeIds.join(',')
	if (excludeIds.length > 0) params.excludes = excludeIds.join(',')

	return params
}
