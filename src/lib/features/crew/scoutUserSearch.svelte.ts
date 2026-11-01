import { userAdapter, type UserInfo } from '$lib/api/adapters/user.adapter'

export interface ScoutUserOption {
	id: string
	username: string
	avatar?: { picture: string; element: string } | undefined
}

type SearchUsers = (query: string) => Promise<ScoutUserOption[]>

/** Searches need at least this many characters */
export const SCOUT_MIN_QUERY = 2
/** Wait this long after the last keystroke before searching */
export const SCOUT_SEARCH_DELAY_MS = 300

/**
 * The user picker in the scout dialog: debounced username search, the
 * combobox's open/input state and the user picked from the results.
 */
export class ScoutUserSearch {
	searchResults = $state<ScoutUserOption[]>([])
	selectedUserId = $state('')
	foundUser = $state<UserInfo | null>(null)
	isLoading = $state(false)
	comboboxOpen = $state(false)
	inputValue = $state('')

	comboboxItems = $derived(this.searchResults.map((u) => ({ value: u.id, label: u.username })))

	#searchTimeout: ReturnType<typeof setTimeout> | null = null
	#searchUsers: SearchUsers

	constructor(searchUsers: SearchUsers = (query) => userAdapter.searchUsers(query)) {
		this.#searchUsers = searchUsers
	}

	async search(query: string) {
		if (query.length < SCOUT_MIN_QUERY) {
			this.searchResults = []
			return
		}

		this.isLoading = true
		try {
			const users = await this.#searchUsers(query)
			this.searchResults = users.map((u) => ({
				id: u.id,
				username: u.username,
				avatar: u.avatar
			}))
			if (this.searchResults.length > 0) {
				this.comboboxOpen = true
			}
		} catch {
			this.searchResults = []
		} finally {
			this.isLoading = false
		}
	}

	/** The input changed: search once typing pauses; a cleared input deselects */
	handleInput(value: string) {
		this.inputValue = value
		if (this.#searchTimeout) clearTimeout(this.#searchTimeout)
		this.#searchTimeout = setTimeout(() => this.search(value), SCOUT_SEARCH_DELAY_MS)

		if (!value.trim()) {
			this.selectedUserId = ''
			this.foundUser = null
		}
	}

	/** A result was picked (or the pick cleared) in the combobox */
	select(value: string) {
		this.selectedUserId = value
		if (value) {
			const match = this.searchResults.find((u) => u.id === value)
			if (match) {
				this.foundUser = {
					id: match.id,
					username: match.username,
					avatar: match.avatar ?? { picture: '', element: '' }
				} as UserInfo
				this.inputValue = match.username
			}
		} else {
			this.foundUser = null
		}
		this.comboboxOpen = false
	}

	/** Drop the picked user and the results, back to an empty search */
	clearSelection() {
		this.searchResults = []
		this.selectedUserId = ''
		this.inputValue = ''
		this.foundUser = null
	}

	reset() {
		this.clearSelection()
		this.comboboxOpen = false
	}
}
