import { RestDataProvider } from 'wx-grid-data-provider'
import { API_BASE } from '$lib/api/core'

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
	private resource: string
	private pageSize: number
	private currentPage: number = 1
	private apiUrl: string
	private totalCount: number = 0
	private totalPages: number = 1

	constructor(options: DatabaseProviderOptions) {
		const apiUrl = `${API_BASE}/search/${options.resource}`

		super(apiUrl, (item) => {
			// Normalize data if needed
			if (item.name && typeof item.name === 'object') {
				// Ensure name is accessible for display
				item.displayName = item.name.en || item.name.ja || '—'
			}
			return item
		})

		this.apiUrl = apiUrl
		this.resource = options.resource
		this.pageSize = options.pageSize || 20
	}

	// Override getData to handle our API's pagination format
	async getData(params?: { page?: number; per_page?: number }): Promise<any[]> {
		const page = params?.page || this.currentPage
		const perPage = params?.per_page || this.pageSize

		try {
			const url = new URL(this.apiUrl)
			url.searchParams.set('page', page.toString())

			const response = await fetch(url.toString(), {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json',
					'X-Per-Page': perPage.toString()
				},
				body: JSON.stringify({})
			})

			if (!response.ok) {
				throw new Error(`API request failed: ${response.statusText}`)
			}

			const result = await response.json()

			// Store metadata for pagination
			this.currentPage = page
			if (result.meta) {
				this.totalCount = result.meta.count || 0
				this.totalPages = result.meta.total_pages || 1
				// Update pageSize if it's different from the response
				if (result.meta.per_page) {
					this.pageSize = result.meta.per_page
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
}