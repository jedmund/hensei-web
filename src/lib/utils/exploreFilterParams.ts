import type { FilterItem } from '$lib/types/filter'
import type { RaidFull } from '$lib/types/api/raid'
import { ELEMENT_TO_PARAM, PARAM_TO_ELEMENT } from '$lib/utils/filterParams'
import { getElementOptions } from '$lib/utils/element'
import {
	getRecencyLabel,
	getPartyLabel,
	getBoostLabel,
	getSideLabel
} from '$lib/utils/exploreFilterOptions'
import { entityAdapter } from '$lib/api/adapters/entity.adapter'
import { localizedName } from '$lib/utils/locale'

// All recognized explore filter param keys
const EXPLORE_FILTER_KEYS = [
	'element',
	'raid',
	'recency',
	'class',
	'party',
	'boost',
	'side',
	'inc',
	'exc',
	'collection'
] as const

// Entity type prefix mapping
const ENTITY_TYPE_PREFIX: Record<string, string> = {
	character: 'c',
	weapon: 'w',
	summon: 's'
}

const PREFIX_TO_ENTITY_TYPE: Record<string, string> = {
	c: 'character',
	w: 'weapon',
	s: 'summon'
}

export interface EntityRef {
	granblueId: string
	type: string
	mode: 'include' | 'exclude'
}

export interface DeserializedExploreFilters {
	filters: FilterItem[]
	entityRefs: EntityRef[]
	collectionFilter: boolean
}

/**
 * Returns true if the URL has any explore filter params
 */
export function urlHasExploreFilters(params: URLSearchParams): boolean {
	return EXPLORE_FILTER_KEYS.some((key) => params.has(key))
}

/**
 * Serialize explore filters and collection state into URL search params
 */
export function serializeExploreFilters(
	filters: FilterItem[],
	opts?: { collectionFilter?: boolean; raids?: RaidFull[] }
): URLSearchParams {
	const params = new URLSearchParams()

	// Element — comma-separated human-readable names
	const elements = filters
		.filter((f): f is FilterItem & { kind: 'element' } => f.kind === 'element')
		.map((f) => ELEMENT_TO_PARAM[f.value])
		.filter(Boolean)
	if (elements.length > 0) params.set('element', elements.join(','))

	// Raid — slug from raids list, fall back to raw value
	const raid = filters.find((f) => f.kind === 'raid')
	if (raid) {
		const raidData = opts?.raids?.find((r) => r.id === raid.value)
		params.set('raid', raidData?.slug ?? (raid.value as string))
	}

	// Recency — numeric seconds
	const recency = filters.find((f) => f.kind === 'recency')
	if (recency) params.set('recency', String(recency.value))

	// Class — string value
	const cls = filters.find((f) => f.kind === 'class')
	if (cls) params.set('class', cls.value as string)

	// Party — comma-separated values
	const partyValues = filters.filter((f) => f.kind === 'party').map((f) => f.value as string)
	if (partyValues.length > 0) params.set('party', partyValues.join(','))

	// Boost — single string
	const boost = filters.find((f) => f.kind === 'boost')
	if (boost) params.set('boost', boost.value as string)

	// Side — single string
	const side = filters.find((f) => f.kind === 'side')
	if (side) params.set('side', side.value as string)

	// Entity include/exclude — type:granblueId format
	const entities = filters.filter((f): f is FilterItem & { kind: 'entity' } => f.kind === 'entity')
	const includes = entities
		.filter((f) => f.mode === 'include')
		.map((f) => `${ENTITY_TYPE_PREFIX[f.entityType] ?? 'c'}:${f.granblueId}`)
	const excludes = entities
		.filter((f) => f.mode === 'exclude')
		.map((f) => `${ENTITY_TYPE_PREFIX[f.entityType] ?? 'c'}:${f.granblueId}`)
	if (includes.length > 0) params.set('inc', includes.join(','))
	if (excludes.length > 0) params.set('exc', excludes.join(','))

	// Collection
	if (opts?.collectionFilter) params.set('collection', '1')

	return params
}

/**
 * Deserialize URL search params into explore filter state.
 *
 * Static filters (element, recency, party, boost, side, class) are returned as FilterItems.
 * Raid filters need the raids list for UUID/label resolution.
 * Entity filters are returned as refs for async resolution.
 */
export function deserializeExploreFilters(
	params: URLSearchParams,
	allRaids?: RaidFull[]
): DeserializedExploreFilters {
	const filters: FilterItem[] = []

	// Element
	const elementParam = params.get('element')
	if (elementParam) {
		const elementOptions = getElementOptions()
		for (const slug of elementParam.split(',')) {
			const value = PARAM_TO_ELEMENT[slug.trim().toLowerCase()]
			if (value !== undefined) {
				const label = elementOptions.find((o) => o.value === value)?.label ?? slug
				filters.push({ kind: 'element', value, label })
			}
		}
	}

	// Raid
	const raidParam = params.get('raid')
	if (raidParam) {
		const slug = raidParam.trim()
		const raid = allRaids?.find((r) => r.slug === slug)
		if (raid) {
			filters.push({
				kind: 'raid',
				value: raid.id,
				label: localizedName(raid.name) ?? slug
			})
		} else {
			// Raids not loaded yet — use slug as placeholder, will be patched via $effect
			filters.push({ kind: 'raid', value: slug, label: slug })
		}
	}

	// Recency
	const recencyParam = params.get('recency')
	if (recencyParam) {
		const value = parseInt(recencyParam, 10)
		if (!isNaN(value)) {
			filters.push({ kind: 'recency', value, label: getRecencyLabel(value) })
		}
	}

	// Class
	const classParam = params.get('class')
	if (classParam) {
		filters.push({ kind: 'class', value: classParam.trim(), label: classParam.trim() })
	}

	// Party
	const partyParam = params.get('party')
	if (partyParam) {
		for (const val of partyParam.split(',')) {
			const value = val.trim()
			if (value) {
				filters.push({ kind: 'party', value, label: getPartyLabel(value) })
			}
		}
	}

	// Boost
	const boostParam = params.get('boost')
	if (boostParam) {
		filters.push({
			kind: 'boost',
			value: boostParam.trim(),
			label: getBoostLabel(boostParam.trim())
		})
	}

	// Side
	const sideParam = params.get('side')
	if (sideParam) {
		filters.push({ kind: 'side', value: sideParam.trim(), label: getSideLabel(sideParam.trim()) })
	}

	// Entity refs (need async resolution)
	const entityRefs: EntityRef[] = []

	for (const [paramKey, mode] of [
		['inc', 'include'],
		['exc', 'exclude']
	] as const) {
		const param = params.get(paramKey)
		if (!param) continue
		for (const entry of param.split(',')) {
			const colonIdx = entry.indexOf(':')
			if (colonIdx === -1) continue
			const prefix = entry.slice(0, colonIdx).trim()
			const granblueId = entry.slice(colonIdx + 1).trim()
			const type = PREFIX_TO_ENTITY_TYPE[prefix]
			if (type && granblueId) {
				entityRefs.push({ granblueId, type, mode })
			}
		}
	}

	// Collection
	const collectionFilter = params.get('collection') === '1'

	return { filters, entityRefs, collectionFilter }
}

/**
 * Resolve entity refs into full FilterItems by fetching from the API.
 * Silently drops entities that fail to resolve.
 */
export async function resolveEntityFilters(refs: EntityRef[]): Promise<FilterItem[]> {
	const results = await Promise.allSettled(
		refs.map(async (ref): Promise<FilterItem> => {
			const fetch =
				ref.type === 'character'
					? entityAdapter.getCharacter(ref.granblueId)
					: ref.type === 'weapon'
						? entityAdapter.getWeapon(ref.granblueId)
						: entityAdapter.getSummon(ref.granblueId)
			const entity = await fetch
			const label = localizedName(entity.name) ?? ref.granblueId
			return {
				kind: 'entity',
				value: entity.id,
				label,
				entityType: ref.type,
				granblueId: entity.granblueId,
				mode: ref.mode,
				element: entity.element
			}
		})
	)

	return results
		.filter((r): r is PromiseFulfilledResult<FilterItem> => r.status === 'fulfilled')
		.map((r) => r.value)
}
