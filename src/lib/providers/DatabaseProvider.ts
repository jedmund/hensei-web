import { RestDataProvider } from 'wx-grid-data-provider'
import { searchAdapter } from '$lib/api/adapters/search.adapter'
import type { SearchParams } from '$lib/api/adapters/search.adapter'
import type { SearchFilters } from '$lib/api/adapters/types'
import { localizedName } from '$lib/utils/locale'

interface DatabaseProviderOptions {
	resource: 'weapons' | 'characters' | 'summons' | 'jobs'
	pageSize?: number
}

interface APIResponse {
	data: any[]
	meta: {
		page: number
		totalPages: number
		pageSize: number
		total: number
	}
}

export class DatabaseProvider extends RestDataProvider<any> {
	private resource: 'weapons' | 'characters' | 'summons' | 'jobs'
	private pageSize: number
	private currentPage: number = 1
	private totalCount: number = 0
	private totalPages: number = 1
	private searchQuery: string = ''
	private sortColumn: string | null = null
	private sortOrder: 'asc' | 'desc' = 'asc'
	private filters: SearchFilters = {}

	constructor(options: DatabaseProviderOptions) {
		// Pass a dummy URL to parent since we'll override getData
		super('dummy', (item: any) => {
			// Normalize data if needed
			if (item.name && typeof item.name === 'object') {
				// Ensure name is accessible for display
				item.displayName = localizedName(item.name)
			}
			return item
		})

		this.resource = options.resource
		this.pageSize = options.pageSize || 20
	}

	// Override getData to handle our API's pagination format
	async getData(params?: { page?: number; per_page?: number }): Promise<any[]> {
		const page = params?.page || this.currentPage
		const perPage = params?.per_page || this.pageSize

		try {
			// Prepare search params
			const searchParams: SearchParams = {
				page: page,
				per: perPage,
				...(this.searchQuery && this.searchQuery.length >= 2 && { query: this.searchQuery }),
				...(this.sortColumn && { sortBy: this.sortColumn }),
				...(this.sortColumn && { sortOrder: this.sortOrder }),
				...(Object.keys(this.filters).length > 0 && { filters: this.filters })
			}

			// Use the appropriate search method based on resource type
			let result
			switch (this.resource) {
				case 'weapons':
					result = await searchAdapter.searchWeapons(searchParams)
					break
				case 'characters':
					result = await searchAdapter.searchCharacters(searchParams)
					break
				case 'summons':
					result = await searchAdapter.searchSummons(searchParams)
					break
				case 'jobs':
					result = await searchAdapter.searchJobs(searchParams)
					break
				default:
					throw new Error(`Unknown resource type: ${this.resource}`)
			}

			// Store metadata for pagination
			this.currentPage = page
			if (result.meta) {
				this.totalCount = result.meta.count || 0
				this.totalPages = result.meta.totalPages || 1
				// Update pageSize if it's different from the response
				if (result.meta.perPage) {
					this.pageSize = result.meta.perPage
				}
			}

			return result.results || []
		} catch (error) {
			console.error('Failed to fetch data:', error)
			return []
		}
	}

	// Get current pagination state
	getPaginationMeta() {
		return {
			page: this.currentPage,
			pageSize: this.pageSize,
			total: this.totalCount,
			totalPages: this.totalPages
		}
	}

	// Handle pagination
	async loadPage(page: number) {
		return this.getData({ page, per_page: this.pageSize })
	}

	// Handle page size changes
	async setPageSize(size: number) {
		this.pageSize = size
		return this.getData({ page: 1, per_page: size })
	}

	// Set search query
	setSearchQuery(query: string) {
		this.searchQuery = query
		// Reset to first page when search changes
		this.currentPage = 1
	}

	// Clear search
	clearSearch() {
		this.searchQuery = ''
		this.currentPage = 1
	}

	// Set sort column and order
	setSort(column: string | null, order: 'asc' | 'desc') {
		this.sortColumn = column
		this.sortOrder = order
	}

	// Set filters
	setFilters(filters: SearchFilters) {
		this.filters = filters
		// Reset to first page when filters change
		this.currentPage = 1
	}

	// Clear filters
	clearFilters() {
		this.filters = {}
		this.currentPage = 1
	}
}