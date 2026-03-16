import type { DatabaseProvider } from '$lib/providers/DatabaseProvider'

export class DatabaseSearch {
	searchTerm = $state('')
	lastSearchTerm = $state('')

	#timeout: ReturnType<typeof setTimeout> | undefined
	#provider: DatabaseProvider
	#onReload: (page: number) => void

	constructor(provider: DatabaseProvider, onReload: (page: number) => void) {
		this.#provider = provider
		this.#onReload = onReload
	}

	handleSearch(term: string) {
		if (this.#timeout) clearTimeout(this.#timeout)

		const trimmed = term.trim()

		// Only clear search and reload if we previously had a non-empty query
		if (trimmed.length < 2) {
			if (this.lastSearchTerm !== '') {
				this.#timeout = setTimeout(() => {
					this.#provider.clearSearch()
					this.lastSearchTerm = ''
					this.#onReload(1)
				}, 300)
			}
			return
		}

		this.#timeout = setTimeout(() => {
			this.lastSearchTerm = trimmed
			this.#provider.setSearchQuery(trimmed)
			this.#onReload(1)
		}, 300)
	}

	cleanup() {
		if (this.#timeout) clearTimeout(this.#timeout)
	}
}
