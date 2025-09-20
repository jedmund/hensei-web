import { RestDataProvider } from 'wx-grid-data-provider'
import { searchAdapter } from '$lib/api/adapters/search.adapter'
import type { SearchParams } from '$lib/api/adapters/search.adapter'

interface DatabaseProviderOptions {
	resource: 'weapons' | 'characters' | 'summons'
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

export class DatabaseProvider extends RestDataProvider {
	private resource: 'weapons' | 'characters' | 'summons'
	private pageSize: number
	private currentPage: number = 1
	private totalCount: number = 0
	private totalPages: number = 1
	private searchQuery: string = ''

	constructor(options: DatabaseProviderOptions) {
		// Pass a dummy URL to parent since we'll override getData
		super('dummy', (item) => {
			// Normalize data if needed
			if (item.name && typeof item.name === 'object') {
				// Ensure name is accessible for display
				item.displayName = item.name.en || item.name.ja || '—'
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
				...(this.searchQuery && this.searchQuery.length >= 2 && { query: this.searchQuery })
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

			// Apply normalizer if defined
			if (this.normalizer && result.results) {
				return result.results.map(this.normalizer)
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
}