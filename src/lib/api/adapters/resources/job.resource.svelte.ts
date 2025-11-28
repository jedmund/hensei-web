/**
 * Reactive Job Resource using Svelte 5 Runes and Runed
 *
 * Provides reactive state management for job-related operations with
 * automatic loading states, error handling, and caching.
 *
 * @module adapters/resources/job
 */

import { JobAdapter, jobAdapter } from '../job.adapter'
import type { Job, JobSkill, JobAccessory } from '$lib/types/api/entities'
import type { AdapterError, AdapterOptions } from '../types'

/**
 * Job resource configuration options
 */
export interface JobResourceOptions {
	/** Job adapter instance to use */
	adapter?: JobAdapter
	/** Cache duration in milliseconds */
	cacheDuration?: number
}

/**
 * State for job data
 */
interface JobState<T> {
	data: T | undefined
	loading: boolean
	error: AdapterError | undefined
	lastFetch: number | undefined
}

/**
 * Creates a reactive job resource for job data management
 * This is a Svelte 5 universal reactive state (works in both components and modules)
 *
 * @example
 * ```svelte
 * <script>
 * import { createJobResource } from '$lib/api/adapters/resources/job.resource.svelte'
 *
 * const jobResource = createJobResource()
 *
 * // Fetch all jobs
 * $effect(() => {
 *   jobResource.fetchJobs()
 * })
 * </script>
 *
 * {#if jobResource.jobs.loading}
 *   <p>Loading jobs...</p>
 * {:else if jobResource.jobs.error}
 *   <p>Error: {jobResource.jobs.error.message}</p>
 * {:else if jobResource.jobs.data}
 *   {#each jobResource.jobs.data as job}
 *     <div>{job.name.en}</div>
 *   {/each}
 * {/if}
 * ```
 */
export class JobResource {
	// Private adapter instance
	private adapter: JobAdapter
	private cacheDuration: number

	// Reactive state for job data
	jobs = $state<JobState<Job[]>>({ loading: false, data: undefined, error: undefined, lastFetch: undefined })
	currentJob = $state<JobState<Job>>({ loading: false, data: undefined, error: undefined, lastFetch: undefined })
	jobSkills = $state<JobState<JobSkill[]>>({ loading: false, data: undefined, error: undefined, lastFetch: undefined })
	jobAccessories = $state<JobState<JobAccessory[]>>({ loading: false, data: undefined, error: undefined, lastFetch: undefined })
	allSkills = $state<JobState<JobSkill[]>>({ loading: false, data: undefined, error: undefined, lastFetch: undefined })

	// Track active requests
	private activeRequests = new Map<string, AbortController>()

	constructor(options: JobResourceOptions = {}) {
		this.adapter = options.adapter || jobAdapter
		this.cacheDuration = options.cacheDuration || 5 * 60 * 1000 // 5 minutes default
	}

	/**
	 * Check if cached data is still valid
	 */
	private isCacheValid(state: JobState<any>): boolean {
		if (!state.data || !state.lastFetch) return false
		return Date.now() - state.lastFetch < this.cacheDuration
	}

	/**
	 * Fetch all jobs
	 */
	async fetchJobs(force = false): Promise<Job[]> {
		// Return cached data if valid and not forced
		if (!force && this.isCacheValid(this.jobs) && this.jobs.data) {
			return this.jobs.data
		}

		// Cancel any existing request
		this.cancelRequest('jobs')

		// Create new abort controller
		const controller = new AbortController()
		this.activeRequests.set('jobs', controller)

		// Update loading state
		this.jobs = { ...this.jobs, loading: true, error: undefined }

		try {
			const data = await this.adapter.getAll()
			this.jobs = { data, loading: false, lastFetch: Date.now(), error: undefined }
			return data
		} catch (error: any) {
			if (error.code !== 'CANCELLED') {
				this.jobs = {
					...this.jobs,
					loading: false,
					error: error as AdapterError
				}
			}
			throw error
		} finally {
			this.activeRequests.delete('jobs')
		}
	}

	/**
	 * Fetch a single job by ID
	 */
	async fetchJob(id: string, force = false): Promise<Job> {
		// Check if this job is already loaded
		if (!force && this.currentJob.data?.id === id && this.isCacheValid(this.currentJob)) {
			return this.currentJob.data
		}

		// Cancel any existing request
		this.cancelRequest('currentJob')

		// Create new abort controller
		const controller = new AbortController()
		this.activeRequests.set('currentJob', controller)

		// Update loading state
		this.currentJob = { ...this.currentJob, loading: true, error: undefined }

		try {
			const data = await this.adapter.getById(id)
			this.currentJob = { data, loading: false, lastFetch: Date.now(), error: undefined }
			return data
		} catch (error: any) {
			if (error.code !== 'CANCELLED') {
				this.currentJob = {
					...this.currentJob,
					loading: false,
					error: error as AdapterError
				}
			}
			throw error
		} finally {
			this.activeRequests.delete('currentJob')
		}
	}

	/**
	 * Fetch skills for a specific job
	 */
	async fetchJobSkills(jobId: string, force = false): Promise<JobSkill[]> {
		// Cancel any existing request
		this.cancelRequest('jobSkills')

		// Create new abort controller
		const controller = new AbortController()
		this.activeRequests.set('jobSkills', controller)

		// Update loading state
		this.jobSkills = { ...this.jobSkills, loading: true, error: undefined }

		try {
			const data = await this.adapter.getSkills(jobId)
			this.jobSkills = { data, loading: false, lastFetch: Date.now(), error: undefined }
			return data
		} catch (error: any) {
			if (error.code !== 'CANCELLED') {
				this.jobSkills = {
					...this.jobSkills,
					loading: false,
					error: error as AdapterError
				}
			}
			throw error
		} finally {
			this.activeRequests.delete('jobSkills')
		}
	}

	/**
	 * Fetch accessories for a specific job
	 */
	async fetchJobAccessories(jobId: string, force = false): Promise<JobAccessory[]> {
		// Cancel any existing request
		this.cancelRequest('jobAccessories')

		// Create new abort controller
		const controller = new AbortController()
		this.activeRequests.set('jobAccessories', controller)

		// Update loading state
		this.jobAccessories = { ...this.jobAccessories, loading: true, error: undefined }

		try {
			const data = await this.adapter.getAccessories(jobId)
			this.jobAccessories = { data, loading: false, lastFetch: Date.now(), error: undefined }
			return data
		} catch (error: any) {
			if (error.code !== 'CANCELLED') {
				this.jobAccessories = {
					...this.jobAccessories,
					loading: false,
					error: error as AdapterError
				}
			}
			throw error
		} finally {
			this.activeRequests.delete('jobAccessories')
		}
	}

	/**
	 * Fetch all available job skills
	 */
	async fetchAllSkills(force = false): Promise<JobSkill[]> {
		// Return cached data if valid and not forced
		if (!force && this.isCacheValid(this.allSkills) && this.allSkills.data) {
			return this.allSkills.data
		}

		// Cancel any existing request
		this.cancelRequest('allSkills')

		// Create new abort controller
		const controller = new AbortController()
		this.activeRequests.set('allSkills', controller)

		// Update loading state
		this.allSkills = { ...this.allSkills, loading: true, error: undefined }

		try {
			const data = await this.adapter.getAllSkills()
			this.allSkills = { data, loading: false, lastFetch: Date.now(), error: undefined }
			return data
		} catch (error: any) {
			if (error.code !== 'CANCELLED') {
				this.allSkills = {
					...this.allSkills,
					loading: false,
					error: error as AdapterError
				}
			}
			throw error
		} finally {
			this.activeRequests.delete('allSkills')
		}
	}

	/**
	 * Update party job
	 */
	async updatePartyJob(partyId: string, jobId: string): Promise<void> {
		await this.adapter.updatePartyJob(partyId, jobId)
	}

	/**
	 * Update party job skills
	 */
	async updatePartyJobSkills(
		partyId: string,
		skills: Array<{ id: string; slot: number }>
	): Promise<void> {
		await this.adapter.updatePartyJobSkills(partyId, skills)
	}

	/**
	 * Remove party job skill
	 */
	async removePartyJobSkill(partyId: string, slot: number): Promise<void> {
		await this.adapter.removePartyJobSkill(partyId, slot)
	}

	/**
	 * Cancel an active request
	 */
	private cancelRequest(key: string) {
		const controller = this.activeRequests.get(key)
		if (controller) {
			controller.abort()
			this.activeRequests.delete(key)
		}
	}

	/**
	 * Cancel all active requests
	 */
	cancelAll() {
		this.activeRequests.forEach(controller => controller.abort())
		this.activeRequests.clear()
	}

	/**
	 * Clear cached data
	 */
	clearCache() {
		this.jobs = { loading: false, data: undefined, error: undefined, lastFetch: undefined }
		this.currentJob = { loading: false, data: undefined, error: undefined, lastFetch: undefined }
		this.jobSkills = { loading: false, data: undefined, error: undefined, lastFetch: undefined }
		this.jobAccessories = { loading: false, data: undefined, error: undefined, lastFetch: undefined }
		this.allSkills = { loading: false, data: undefined, error: undefined, lastFetch: undefined }
	}
}

/**
 * Create a new job resource instance
 */
export function createJobResource(options?: JobResourceOptions): JobResource {
	return new JobResource(options)
}

/**
 * Helper to group jobs by tier (row)
 */
export function groupJobsByTier(jobs: Job[]): Record<string, Job[]> {
	const tiers: Record<string, Job[]> = {
		'1': [],
		'2': [],
		'3': [],
		'4': [],
		'5': [],
		'ex': [],
		'ex2': []
	}

	for (const job of jobs) {
		const tier = job.row.toString().toLowerCase()
		if (tier in tiers && tiers[tier]) {
			tiers[tier].push(job)
		}
	}

	// Sort jobs within each tier by order
	for (const tier in tiers) {
		if (tiers[tier]) {
			tiers[tier].sort((a, b) => a.order - b.order)
		}
	}

	return tiers
}

/**
 * Helper to get tier display name
 */
export function getTierDisplayName(tier: string): string {
	const tierNames: Record<string, string> = {
		'1': 'Class I',
		'2': 'Class II',
		'3': 'Class III',
		'4': 'Class IV',
		'5': 'Class V',
		'ex': 'Extra',
		'ex2': 'Extra II'
	}
	return tierNames[tier] || tier
}
