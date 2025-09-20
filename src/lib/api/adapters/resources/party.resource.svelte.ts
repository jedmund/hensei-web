/**
 * Reactive Party Resource using Svelte 5 Runes
 *
 * Provides reactive state management for party operations with
 * automatic loading states, error handling, and optimistic updates.
 *
 * @module adapters/resources/party
 */

import { PartyAdapter, type Party, type CreatePartyParams, type UpdatePartyParams } from '../party.adapter'
import type { AdapterError } from '../types'

/**
 * Party resource configuration options
 */
export interface PartyResourceOptions {
	/** Party adapter instance to use */
	adapter?: PartyAdapter
	/** Enable optimistic updates for mutations */
	optimistic?: boolean
}

/**
 * Resource state for a single party
 */
interface PartyState {
	data?: Party
	loading: boolean
	error?: AdapterError
	updating?: boolean
}

/**
 * Resource state for party lists
 */
interface PartyListState {
	parties: Party[]
	total?: number
	page?: number
	totalPages?: number
	loading: boolean
	error?: AdapterError
}

/**
 * Creates a reactive party resource for managing parties
 *
 * @example
 * ```svelte
 * <script>
 * import { createPartyResource } from '$lib/api/adapters/resources'
 *
 * const party = createPartyResource()
 *
 * // Load a party
 * party.load('ABC123')
 *
 * // Update party details
 * party.update({
 *   shortcode: 'ABC123',
 *   name: 'New Name'
 * })
 * </script>
 *
 * {#if party.current.loading}
 *   <p>Loading party...</p>
 * {:else if party.current.error}
 *   <p>Error: {party.current.error.message}</p>
 * {:else if party.current.data}
 *   <h1>{party.current.data.name}</h1>
 * {/if}
 * ```
 */
export class PartyResource {
	private adapter: PartyAdapter
	private optimistic: boolean

	// Reactive state for current party
	current = $state<PartyState>({ loading: false })

	// Reactive state for user parties list
	userParties = $state<PartyListState>({
		parties: [],
		loading: false
	})

	// Track active requests for cancellation
	private activeRequests = new Map<string, AbortController>()

	constructor(options: PartyResourceOptions = {}) {
		this.adapter = options.adapter || new PartyAdapter()
		this.optimistic = options.optimistic ?? true
	}

	/**
	 * Loads a party by shortcode
	 */
	async load(shortcode: string): Promise<Party | undefined> {
		// Cancel any existing load request
		this.cancelRequest('load')

		const controller = new AbortController()
		this.activeRequests.set('load', controller)

		this.current = { ...this.current, loading: true, error: undefined }

		try {
			const party = await this.adapter.getByShortcode(shortcode)
			this.current = { data: party, loading: false }
			return party
		} catch (error: any) {
			if (error.code !== 'CANCELLED') {
				this.current = {
					...this.current,
					loading: false,
					error: error as AdapterError
				}
			}
		} finally {
			this.activeRequests.delete('load')
		}
	}

	/**
	 * Creates a new party
	 */
	async create(params: CreatePartyParams): Promise<Party | undefined> {
		this.current = { ...this.current, updating: true, error: undefined }

		try {
			const party = await this.adapter.create(params)
			this.current = { data: party, loading: false, updating: false }

			// Add to user parties if loaded
			if (this.userParties.parties.length > 0) {
				this.userParties.parties = [party, ...this.userParties.parties]
				if (this.userParties.total !== undefined) {
					this.userParties.total++
				}
			}

			return party
		} catch (error: any) {
			this.current = {
				...this.current,
				updating: false,
				error: error as AdapterError
			}
		}
	}

	/**
	 * Updates the current party
	 */
	async update(params: UpdatePartyParams): Promise<Party | undefined> {
		// Optimistic update
		if (this.optimistic && this.current.data) {
			const optimisticData = {
				...this.current.data,
				...params,
				updatedAt: new Date().toISOString()
			}
			this.current = {
				...this.current,
				data: optimisticData as Party,
				updating: true
			}
		} else {
			this.current = { ...this.current, updating: true }
		}

		try {
			const party = await this.adapter.update(params)
			this.current = { data: party, loading: false, updating: false }

			// Update in user parties list if present
			const index = this.userParties.parties.findIndex(
				p => p.shortcode === params.shortcode
			)
			if (index !== -1) {
				this.userParties.parties[index] = party
			}

			return party
		} catch (error: any) {
			// Revert optimistic update on error
			if (this.optimistic) {
				await this.load(params.shortcode)
			}
			this.current = {
				...this.current,
				updating: false,
				error: error as AdapterError
			}
		}
	}

	/**
	 * Deletes the current party
	 */
	async delete(shortcode: string): Promise<boolean> {
		this.current = { ...this.current, updating: true, error: undefined }

		try {
			await this.adapter.delete(shortcode)

			// Clear current party
			this.current = { loading: false, updating: false }

			// Remove from user parties list
			this.userParties.parties = this.userParties.parties.filter(
				p => p.shortcode !== shortcode
			)
			if (this.userParties.total !== undefined && this.userParties.total > 0) {
				this.userParties.total--
			}

			return true
		} catch (error: any) {
			this.current = {
				...this.current,
				updating: false,
				error: error as AdapterError
			}
			return false
		}
	}

	/**
	 * Creates a remix (copy) of a party
	 */
	async remix(shortcode: string): Promise<Party | undefined> {
		this.current = { ...this.current, updating: true, error: undefined }

		try {
			const party = await this.adapter.remix(shortcode)
			this.current = { data: party, loading: false, updating: false }

			// Add to user parties if it's the current user's remix
			if (this.userParties.parties.length > 0) {
				this.userParties.parties = [party, ...this.userParties.parties]
				if (this.userParties.total !== undefined) {
					this.userParties.total++
				}
			}

			return party
		} catch (error: any) {
			this.current = {
				...this.current,
				updating: false,
				error: error as AdapterError
			}
		}
	}

	/**
	 * Loads parties for a specific user
	 */
	async loadUserParties(
		username: string,
		params: Omit<Parameters<PartyAdapter['listUserParties']>[0], 'username'> = {}
	): Promise<void> {
		// Cancel any existing user parties request
		this.cancelRequest('userParties')

		const controller = new AbortController()
		this.activeRequests.set('userParties', controller)

		this.userParties = { ...this.userParties, loading: true, error: undefined }

		try {
			const response = await this.adapter.listUserParties({
				username,
				...params
			})

			this.userParties = {
				parties: response.results,
				total: response.total,
				page: response.page,
				totalPages: response.totalPages,
				loading: false
			}
		} catch (error: any) {
			if (error.code !== 'CANCELLED') {
				this.userParties = {
					...this.userParties,
					loading: false,
					error: error as AdapterError
				}
			}
		} finally {
			this.activeRequests.delete('userParties')
		}
	}

	/**
	 * Updates the job for the current party
	 */
	async updateJob(
		shortcode: string,
		jobId: string,
		skills?: Array<{ id: string; slot: number }>,
		accessoryId?: string
	): Promise<Party | undefined> {
		this.current = { ...this.current, updating: true, error: undefined }

		try {
			const party = await this.adapter.updateJob(shortcode, jobId, skills, accessoryId)
			this.current = { data: party, loading: false, updating: false }
			return party
		} catch (error: any) {
			this.current = {
				...this.current,
				updating: false,
				error: error as AdapterError
			}
		}
	}

	/**
	 * Cancels an active request
	 */
	private cancelRequest(key: string) {
		const controller = this.activeRequests.get(key)
		if (controller) {
			controller.abort()
			this.activeRequests.delete(key)
		}
	}

	/**
	 * Cancels all active requests
	 */
	cancelAll() {
		this.activeRequests.forEach(controller => controller.abort())
		this.activeRequests.clear()
	}

	/**
	 * Clears the current party state
	 */
	clearCurrent() {
		this.cancelRequest('load')
		this.current = { loading: false }
	}

	/**
	 * Clears the user parties state
	 */
	clearUserParties() {
		this.cancelRequest('userParties')
		this.userParties = { parties: [], loading: false }
	}

	/**
	 * Clears all states
	 */
	clearAll() {
		this.cancelAll()
		this.current = { loading: false }
		this.userParties = { parties: [], loading: false }
	}

	/**
	 * Clears the adapter's cache
	 */
	clearCache(shortcode?: string) {
		this.adapter.clearPartyCache(shortcode)
	}
}

/**
 * Factory function for creating party resources
 */
export function createPartyResource(options?: PartyResourceOptions): PartyResource {
	return new PartyResource(options)
}