import type { UnifiedSearchSeriesRef } from '$lib/api/adapters/search.adapter'

export type FilterItem =
	| { kind: 'element'; value: number; label: string; pinned?: boolean }
	| { kind: 'raid'; value: string; label: string; pinned?: boolean }
	| { kind: 'recency'; value: number; label: string; pinned?: boolean }
	| { kind: 'class'; value: string; label: string; pinned?: boolean }
	| {
			kind: 'entity'
			value: string
			label: string
			entityType: string
			granblueId: string
			mode: 'include' | 'exclude'
			element?: number
			pinned?: boolean
		}
	| { kind: 'party'; value: string; label: string; pinned?: boolean }
	| { kind: 'boost'; value: string; label: string; pinned?: boolean }
	| { kind: 'side'; value: string; label: string; pinned?: boolean }

export interface FilterOption {
	kind: FilterItem['kind']
	value: string | number
	label: string
	category: string
	entityType?: string
	granblueId?: string
	element?: number
	season?: number | null
	series?: UnifiedSearchSeriesRef[] | null
}

export interface PlaceholderSuggestion {
	label: string
	category: string
	option?: FilterOption
}
