import { describe, it, expect, vi } from 'vitest'
import type { FilterItem } from '$lib/types/filter'
import type { RaidFull } from '$lib/types/api/raid'
import {
	serializeExploreFilters,
	deserializeExploreFilters,
	urlHasExploreFilters,
	resolveEntityFilters,
	urlParamsToExploreFilterParams
} from '../exploreFilterParams'

// Mock entity adapter for resolveEntityFilters tests
vi.mock('$lib/api/adapters/entity.adapter', () => ({
	entityAdapter: {
		getCharacter: vi.fn(),
		getWeapon: vi.fn(),
		getSummon: vi.fn()
	}
}))

const mockRaid: RaidFull = {
	id: 'raid-uuid-1',
	slug: 'proto-bahamut-hl',
	name: { en: 'Proto Bahamut HL', ja: 'プロトバハムートHL' },
	level: 150,
	element: 0,
	playerCount: 30,
	extra: false
}

const mockRaids: RaidFull[] = [mockRaid]

// ============================================================================
// urlHasExploreFilters
// ============================================================================

describe('urlHasExploreFilters', () => {
	it('returns false for empty params', () => {
		expect(urlHasExploreFilters(new URLSearchParams())).toBe(false)
	})

	it('returns true for element param', () => {
		expect(urlHasExploreFilters(new URLSearchParams('element=fire'))).toBe(true)
	})

	it('returns true for collection param', () => {
		expect(urlHasExploreFilters(new URLSearchParams('collection=1'))).toBe(true)
	})

	it('returns true for entity include param', () => {
		expect(urlHasExploreFilters(new URLSearchParams('inc=c:3040000000'))).toBe(true)
	})

	it('ignores unrelated params', () => {
		expect(urlHasExploreFilters(new URLSearchParams('page=2&sort=recent'))).toBe(false)
	})
})

// ============================================================================
// serializeExploreFilters
// ============================================================================

describe('serializeExploreFilters', () => {
	it('returns empty params for empty filters', () => {
		const params = serializeExploreFilters([])
		expect(params.toString()).toBe('')
	})

	it('serializes element filters as comma-separated names', () => {
		const filters: FilterItem[] = [
			{ kind: 'element', value: 2, label: 'Fire' },
			{ kind: 'element', value: 3, label: 'Water' }
		]
		const params = serializeExploreFilters(filters)
		expect(params.get('element')).toBe('fire,water')
	})

	it('serializes raid filter as slug when raids are provided', () => {
		const filters: FilterItem[] = [
			{ kind: 'raid', value: 'raid-uuid-1', label: 'Proto Bahamut HL' }
		]
		const params = serializeExploreFilters(filters, { raids: mockRaids })
		expect(params.get('raid')).toBe('proto-bahamut-hl')
	})

	it('falls back to raw value when raids are not provided', () => {
		const filters: FilterItem[] = [
			{ kind: 'raid', value: 'raid-uuid-1', label: 'Proto Bahamut HL' }
		]
		const params = serializeExploreFilters(filters)
		expect(params.get('raid')).toBe('raid-uuid-1')
	})

	it('serializes recency as numeric string', () => {
		const filters: FilterItem[] = [{ kind: 'recency', value: 604800, label: 'Last week' }]
		const params = serializeExploreFilters(filters)
		expect(params.get('recency')).toBe('604800')
	})

	it('serializes class filter', () => {
		const filters: FilterItem[] = [{ kind: 'class', value: 'kengo', label: 'Kengo' }]
		const params = serializeExploreFilters(filters)
		expect(params.get('class')).toBe('kengo')
	})

	it('serializes multiple party filters as comma-separated', () => {
		const filters: FilterItem[] = [
			{ kind: 'party', value: 'full_auto', label: 'Full Auto' },
			{ kind: 'party', value: 'solo', label: 'Solo' }
		]
		const params = serializeExploreFilters(filters)
		expect(params.get('party')).toBe('full_auto,solo')
	})

	it('serializes boost and side filters', () => {
		const filters: FilterItem[] = [
			{ kind: 'boost', value: 'primal', label: 'Primal' },
			{ kind: 'side', value: 'double', label: 'Double' }
		]
		const params = serializeExploreFilters(filters)
		expect(params.get('boost')).toBe('primal')
		expect(params.get('side')).toBe('double')
	})

	it('serializes entity includes with type prefix', () => {
		const filters: FilterItem[] = [
			{
				kind: 'entity',
				value: 'uuid-1',
				label: 'Narmaya',
				entityType: 'character',
				granblueId: '3040000000',
				mode: 'include',
				element: 5
			}
		]
		const params = serializeExploreFilters(filters)
		expect(params.get('inc')).toBe('c:3040000000')
		expect(params.has('exc')).toBe(false)
	})

	it('serializes entity excludes separately', () => {
		const filters: FilterItem[] = [
			{
				kind: 'entity',
				value: 'uuid-1',
				label: 'Narmaya',
				entityType: 'character',
				granblueId: '3040000000',
				mode: 'include',
				element: 5
			},
			{
				kind: 'entity',
				value: 'uuid-2',
				label: 'AK-4A',
				entityType: 'weapon',
				granblueId: '1040000000',
				mode: 'exclude',
				element: 3
			}
		]
		const params = serializeExploreFilters(filters)
		expect(params.get('inc')).toBe('c:3040000000')
		expect(params.get('exc')).toBe('w:1040000000')
	})

	it('serializes collection filter', () => {
		const params = serializeExploreFilters([], { collectionFilter: true })
		expect(params.get('collection')).toBe('1')
	})

	it('omits collection when false', () => {
		const params = serializeExploreFilters([], { collectionFilter: false })
		expect(params.has('collection')).toBe(false)
	})
})

// ============================================================================
// deserializeExploreFilters
// ============================================================================

describe('deserializeExploreFilters', () => {
	it('returns empty for no params', () => {
		const result = deserializeExploreFilters(new URLSearchParams())
		expect(result.filters).toEqual([])
		expect(result.entityRefs).toEqual([])
		expect(result.collectionFilter).toBe(false)
	})

	it('deserializes element params', () => {
		const result = deserializeExploreFilters(new URLSearchParams('element=fire,water'))
		const elements = result.filters.filter((f) => f.kind === 'element')
		expect(elements).toHaveLength(2)
		expect(elements[0]!.value).toBe(2)
		expect(elements[1]!.value).toBe(3)
	})

	it('deserializes raid with raids list', () => {
		const result = deserializeExploreFilters(
			new URLSearchParams('raid=proto-bahamut-hl'),
			mockRaids
		)
		const raid = result.filters.find((f) => f.kind === 'raid')
		expect(raid).toBeDefined()
		expect(raid!.value).toBe('raid-uuid-1')
	})

	it('deserializes raid without raids list using slug as placeholder', () => {
		const result = deserializeExploreFilters(new URLSearchParams('raid=proto-bahamut-hl'))
		const raid = result.filters.find((f) => f.kind === 'raid')
		expect(raid).toBeDefined()
		expect(raid!.value).toBe('proto-bahamut-hl')
		expect(raid!.label).toBe('proto-bahamut-hl')
	})

	it('deserializes recency param', () => {
		const result = deserializeExploreFilters(new URLSearchParams('recency=604800'))
		const recency = result.filters.find((f) => f.kind === 'recency')
		expect(recency).toBeDefined()
		expect(recency!.value).toBe(604800)
	})

	it('deserializes class param', () => {
		const result = deserializeExploreFilters(new URLSearchParams('class=kengo'))
		const cls = result.filters.find((f) => f.kind === 'class')
		expect(cls).toBeDefined()
		expect(cls!.value).toBe('kengo')
		expect(cls!.label).toBe('kengo')
	})

	it('deserializes party params', () => {
		const result = deserializeExploreFilters(new URLSearchParams('party=full_auto,solo'))
		const partyFilters = result.filters.filter((f) => f.kind === 'party')
		expect(partyFilters).toHaveLength(2)
		expect(partyFilters.map((f) => f.value)).toEqual(['full_auto', 'solo'])
	})

	it('deserializes boost and side params', () => {
		const result = deserializeExploreFilters(new URLSearchParams('boost=primal&side=double'))
		expect(result.filters.find((f) => f.kind === 'boost')!.value).toBe('primal')
		expect(result.filters.find((f) => f.kind === 'side')!.value).toBe('double')
	})

	it('extracts entity refs from inc and exc params', () => {
		const result = deserializeExploreFilters(
			new URLSearchParams('inc=c:3040000000,w:1040000000&exc=s:2040000000')
		)
		expect(result.entityRefs).toHaveLength(3)
		expect(result.entityRefs[0]).toEqual({
			granblueId: '3040000000',
			type: 'character',
			mode: 'include'
		})
		expect(result.entityRefs[1]).toEqual({
			granblueId: '1040000000',
			type: 'weapon',
			mode: 'include'
		})
		expect(result.entityRefs[2]).toEqual({
			granblueId: '2040000000',
			type: 'summon',
			mode: 'exclude'
		})
	})

	it('deserializes collection param', () => {
		const result = deserializeExploreFilters(new URLSearchParams('collection=1'))
		expect(result.collectionFilter).toBe(true)
	})

	it('ignores invalid element values', () => {
		const result = deserializeExploreFilters(new URLSearchParams('element=fire,invalid,water'))
		const elements = result.filters.filter((f) => f.kind === 'element')
		expect(elements).toHaveLength(2)
	})

	it('ignores invalid entity prefixes', () => {
		const result = deserializeExploreFilters(new URLSearchParams('inc=x:123,c:456'))
		expect(result.entityRefs).toHaveLength(1)
		expect(result.entityRefs[0]!.granblueId).toBe('456')
	})
})

// ============================================================================
// Roundtrip: serialize → deserialize
// ============================================================================

describe('roundtrip', () => {
	it('roundtrips element filters', () => {
		const original: FilterItem[] = [
			{ kind: 'element', value: 2, label: 'Fire' },
			{ kind: 'element', value: 6, label: 'Light' }
		]
		const params = serializeExploreFilters(original)
		const { filters } = deserializeExploreFilters(params)
		expect(filters.map((f) => f.value)).toEqual([2, 6])
	})

	it('roundtrips raid filter with raids list', () => {
		const original: FilterItem[] = [
			{ kind: 'raid', value: 'raid-uuid-1', label: 'Proto Bahamut HL' }
		]
		const params = serializeExploreFilters(original, { raids: mockRaids })
		const { filters } = deserializeExploreFilters(params, mockRaids)
		expect(filters[0]!.value).toBe('raid-uuid-1')
	})

	it('roundtrips recency filter', () => {
		const original: FilterItem[] = [{ kind: 'recency', value: 604800, label: 'Last week' }]
		const params = serializeExploreFilters(original)
		const { filters } = deserializeExploreFilters(params)
		expect(filters[0]!.value).toBe(604800)
	})

	it('roundtrips party filters', () => {
		const original: FilterItem[] = [
			{ kind: 'party', value: 'full_auto', label: 'Full Auto' },
			{ kind: 'party', value: 'solo', label: 'Solo' }
		]
		const params = serializeExploreFilters(original)
		const { filters } = deserializeExploreFilters(params)
		expect(filters.map((f) => f.value)).toEqual(['full_auto', 'solo'])
	})

	it('roundtrips entity refs', () => {
		const original: FilterItem[] = [
			{
				kind: 'entity',
				value: 'uuid-1',
				label: 'Narmaya',
				entityType: 'character',
				granblueId: '3040000000',
				mode: 'include',
				element: 5
			},
			{
				kind: 'entity',
				value: 'uuid-2',
				label: 'Bahamut',
				entityType: 'summon',
				granblueId: '2040000000',
				mode: 'exclude',
				element: 0
			}
		]
		const params = serializeExploreFilters(original)
		const { entityRefs } = deserializeExploreFilters(params)
		expect(entityRefs).toEqual([
			{ granblueId: '3040000000', type: 'character', mode: 'include' },
			{ granblueId: '2040000000', type: 'summon', mode: 'exclude' }
		])
	})

	it('roundtrips collection filter', () => {
		const params = serializeExploreFilters([], { collectionFilter: true })
		const { collectionFilter } = deserializeExploreFilters(params)
		expect(collectionFilter).toBe(true)
	})

	it('roundtrips a complex filter set', () => {
		const original: FilterItem[] = [
			{ kind: 'element', value: 5, label: 'Dark' },
			{ kind: 'raid', value: 'raid-uuid-1', label: 'Proto Bahamut HL' },
			{ kind: 'recency', value: 86400, label: 'Last day' },
			{ kind: 'party', value: 'full_auto', label: 'Full Auto' },
			{ kind: 'boost', value: 'primal', label: 'Primal' },
			{ kind: 'side', value: 'double', label: 'Double' },
			{ kind: 'class', value: 'kengo', label: 'Kengo' }
		]
		const params = serializeExploreFilters(original, {
			collectionFilter: true,
			raids: mockRaids
		})
		const { filters, collectionFilter } = deserializeExploreFilters(params, mockRaids)

		expect(filters).toHaveLength(7)
		expect(filters.find((f) => f.kind === 'element')!.value).toBe(5)
		expect(filters.find((f) => f.kind === 'raid')!.value).toBe('raid-uuid-1')
		expect(filters.find((f) => f.kind === 'recency')!.value).toBe(86400)
		expect(filters.find((f) => f.kind === 'party')!.value).toBe('full_auto')
		expect(filters.find((f) => f.kind === 'boost')!.value).toBe('primal')
		expect(filters.find((f) => f.kind === 'side')!.value).toBe('double')
		expect(filters.find((f) => f.kind === 'class')!.value).toBe('kengo')
		expect(collectionFilter).toBe(true)
	})
})

// ============================================================================
// resolveEntityFilters
// ============================================================================

describe('resolveEntityFilters', () => {
	it('resolves character entities', async () => {
		const { entityAdapter } = await import('$lib/api/adapters/entity.adapter')
		vi.mocked(entityAdapter.getCharacter).mockResolvedValue({
			id: 'char-uuid',
			granblueId: '3040000000',
			name: { en: 'Narmaya', ja: 'ナルメア' },
			element: 5
		} as Awaited<ReturnType<typeof entityAdapter.getCharacter>>)

		const result = await resolveEntityFilters([
			{ granblueId: '3040000000', type: 'character', mode: 'include' }
		])

		expect(result).toHaveLength(1)
		const item = result[0]!
		expect(item.kind).toBe('entity')
		expect(item.value).toBe('char-uuid')
		if (item.kind === 'entity') {
			expect(item.granblueId).toBe('3040000000')
		}
	})

	it('silently drops failed resolutions', async () => {
		const { entityAdapter } = await import('$lib/api/adapters/entity.adapter')
		vi.mocked(entityAdapter.getCharacter).mockRejectedValue(new Error('Not found'))

		const result = await resolveEntityFilters([
			{ granblueId: '9999999999', type: 'character', mode: 'include' }
		])

		expect(result).toHaveLength(0)
	})

	it('passes options through to adapter methods', async () => {
		const { entityAdapter } = await import('$lib/api/adapters/entity.adapter')
		const mockFetch = vi.fn()
		vi.mocked(entityAdapter.getWeapon).mockResolvedValue({
			id: 'wpn-uuid',
			granblueId: '1040000000',
			name: { en: 'AK-4A', ja: 'AK-4A' },
			element: 3
		} as Awaited<ReturnType<typeof entityAdapter.getWeapon>>)

		await resolveEntityFilters([{ granblueId: '1040000000', type: 'weapon', mode: 'include' }], {
			fetch: mockFetch as unknown as typeof globalThis.fetch
		})

		expect(entityAdapter.getWeapon).toHaveBeenCalledWith('1040000000', {
			fetch: mockFetch
		})
	})
})

// ============================================================================
// urlParamsToExploreFilterParams
// ============================================================================

describe('urlParamsToExploreFilterParams', () => {
	it('returns static filters and API params', async () => {
		const result = await urlParamsToExploreFilterParams(
			new URLSearchParams('element=fire&recency=604800')
		)
		expect(result.filterItems).toHaveLength(2)
		expect(result.apiParams.element).toBeDefined()
		expect(result.collectionFilter).toBe(false)
	})

	it('returns collection filter state', async () => {
		const result = await urlParamsToExploreFilterParams(new URLSearchParams('collection=1'))
		expect(result.collectionFilter).toBe(true)
	})

	it('skips entity resolution when no fetch is provided', async () => {
		const result = await urlParamsToExploreFilterParams(
			new URLSearchParams('element=fire&inc=c:3040000000')
		)
		// Only the element filter should be present, not the entity
		expect(result.filterItems).toHaveLength(1)
		expect(result.filterItems[0]!.kind).toBe('element')
	})

	it('resolves entity filters when fetch is provided', async () => {
		const { entityAdapter } = await import('$lib/api/adapters/entity.adapter')
		vi.mocked(entityAdapter.getCharacter).mockResolvedValue({
			id: 'char-uuid',
			granblueId: '3040000000',
			name: { en: 'Narmaya', ja: 'ナルメア' },
			element: 5
		} as Awaited<ReturnType<typeof entityAdapter.getCharacter>>)

		const mockFetch = vi.fn()
		const result = await urlParamsToExploreFilterParams(
			new URLSearchParams('element=fire&inc=c:3040000000'),
			{ fetch: mockFetch as unknown as typeof globalThis.fetch }
		)

		expect(result.filterItems).toHaveLength(2)
		expect(result.filterItems.find((f) => f.kind === 'entity')).toBeDefined()
	})
})
