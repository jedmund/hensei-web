/**
 * Job Adapter
 *
 * Handles all job-related API operations including fetching jobs, skills, and accessories.
 * Provides a clean interface for job management with automatic
 * request handling, caching, and error management.
 *
 * @module adapters/job
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Job, JobSkill, JobAccessory } from '$lib/types/api/entities'

/**
 * Parameters for searching job skills
 */
export interface SearchJobSkillsParams {
	query?: string
	jobId: string  // Required for API
	page?: number
	per?: number
	locale?: string
	filters?: { group?: number }
}

/**
 * Payload for creating/updating a job skill
 */
export interface JobSkillPayload {
	name_en: string
	name_jp?: string
	slug: string
	color?: number
	main?: boolean
	base?: boolean
	sub?: boolean
	emp?: boolean
	order?: number
	image_id?: string
	action_id?: number
}

/**
 * Payload for creating/updating a job accessory
 */
export interface JobAccessoryPayload {
	name_en: string
	name_jp?: string
	granblue_id: string
	rarity?: number
	release_date?: string
	accessory_type: number  // 1 = Shield, 2 = Manatura
	job_id?: string
}

/**
 * Payload for updating a job entity
 */
export interface JobUpdatePayload {
	name_en?: string
	name_jp?: string
	granblue_id?: string
	proficiency1?: number
	proficiency2?: number
	row?: string
	order?: number
	master_level?: boolean
	ultimate_mastery?: boolean
	accessory?: boolean
	accessory_type?: number
	aux_weapon?: boolean
	base_job_id?: string | null
}

/**
 * Job skill search response
 */
export interface JobSkillSearchResponse {
	results: JobSkill[]
	total: number
	page: number
	totalPages: number
	meta?: {
		count: number
		page: number
		perPage: number
		totalPages: number
	}
}

/**
 * Job adapter for managing jobs and their related data
 */
export class JobAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	/**
	 * Gets all available jobs
	 * Jobs are returned as a flat array from the API
	 */
	async getAll(): Promise<Job[]> {
		const response = await this.request<Job[]>('/jobs')
		return response
	}

	/**
	 * Gets a single job by ID
	 */
	async getById(id: string): Promise<Job> {
		const response = await this.request<Job>(`/jobs/${id}`)
		return response
	}

	/**
	 * Gets all skills for a specific job
	 * Returns skills categorized by type (main, sub, emp, base)
	 */
	async getSkills(jobId: string): Promise<JobSkill[]> {
		return this.request<JobSkill[]>(`/jobs/${jobId}/skills`)
	}

	/**
	 * Gets all accessories available for a specific job
	 * Only returns data if the job supports accessories
	 */
	async getAccessoriesForJob(jobId: string): Promise<JobAccessory[]> {
		return this.request<JobAccessory[]>(`/jobs/${jobId}/accessories`)
	}

	/**
	 * Creates a new job entity (database admin function)
	 * @param data The job data
	 */
	async createJob(data: JobUpdatePayload): Promise<Job> {
		const response = await this.request<Job>('/jobs', {
			method: 'POST',
			body: data
		})
		// Clear jobs cache to reflect the new job
		this.clearCache('/jobs')
		return response
	}

	/**
	 * Updates a job entity (database admin function)
	 * @param granblueId The job's granblue_id
	 * @param data The fields to update
	 */
	async updateJob(granblueId: string, data: JobUpdatePayload): Promise<Job> {
		const response = await this.request<Job>(`/jobs/${granblueId}`, {
			method: 'PUT',
			body: data
		})
		// Clear jobs cache to reflect the change
		this.clearCache('/jobs')
		this.clearCache(`/jobs/${granblueId}`)
		return response
	}

	/**
	 * Searches for job skills based on query and filters
	 * Used for the skill selection interface with pagination
	 */
	async searchSkills(params: SearchJobSkillsParams): Promise<JobSkillSearchResponse> {
		const response = await this.request<{
			results: JobSkill[]
			meta?: {
				count?: number
				totalPages?: number
				perPage?: number
			}
		}>('/search/job_skills', {
			method: 'POST',
			body: {
				search: {
					query: params.query || '',
					job: params.jobId,
					page: params.page || 1,
					locale: params.locale || 'en',
					filters: params.filters || {}
				}
			}
			// Note: No caching - filters change frequently and cache key bug causes stale data
		})

		// BaseAdapter already transforms snake_case → camelCase,
		// so meta keys are already totalPages, perPage, etc.
		return {
			results: response.results,
			page: params.page || 1,
			total: response.meta?.count || 0,
			totalPages: response.meta?.totalPages || 1,
			meta: response.meta ? {
				count: response.meta.count ?? 0,
				page: params.page || 1,
				perPage: response.meta.perPage ?? 10,
				totalPages: response.meta.totalPages ?? 1
			} : undefined
		}
	}

	/**
	 * Gets all available job skills (not filtered by job)
	 * Useful for browsing all skills
	 */
	async getAllSkills(): Promise<JobSkill[]> {
		return this.request<JobSkill[]>('/jobs/skills')
	}

	/**
	 * Gets EMP skills from other jobs (for party skill selection)
	 * Returns skills that can be used with the specified job
	 */
	async getEmpSkills(jobId: string): Promise<JobSkill[]> {
		return this.request<JobSkill[]>(`/jobs/${jobId}/emp_skills`)
	}

	/**
	 * Creates a new skill for a job
	 * @param jobId The job's granblue_id
	 * @param data The skill data
	 */
	async createSkill(jobId: string, data: JobSkillPayload): Promise<JobSkill> {
		const response = await this.request<JobSkill>(`/jobs/${jobId}/skills`, {
			method: 'POST',
			body: data
		})
		this.clearCache(`/jobs/${jobId}/skills`)
		return response
	}

	/**
	 * Updates an existing job skill
	 * @param jobId The job's granblue_id
	 * @param skillId The skill's ID
	 * @param data The updated skill data
	 */
	async updateSkill(jobId: string, skillId: string, data: JobSkillPayload): Promise<JobSkill> {
		const response = await this.request<JobSkill>(`/jobs/${jobId}/skills/${skillId}`, {
			method: 'PUT',
			body: data
		})
		this.clearCache(`/jobs/${jobId}/skills`)
		return response
	}

	/**
	 * Deletes a job skill
	 * @param jobId The job's granblue_id
	 * @param skillId The skill's ID
	 */
	async deleteSkill(jobId: string, skillId: string): Promise<void> {
		await this.request(`/jobs/${jobId}/skills/${skillId}`, {
			method: 'DELETE'
		})
		this.clearCache(`/jobs/${jobId}/skills`)
	}

	/**
	 * Downloads the image for a job skill
	 * @param jobId The job's granblue_id
	 * @param skillId The skill's ID
	 * @returns Object with success status and filename
	 */
	async downloadSkillImage(jobId: string, skillId: string): Promise<{ success: boolean; filename: string }> {
		return this.request<{ success: boolean; filename: string }>(`/jobs/${jobId}/skills/${skillId}/download_image`, {
			method: 'POST'
		})
	}

	/**
	 * Updates the job for a party
	 * @param partyId The party's ID (UUID)
	 * @param jobId The job ID to set
	 */
	async updatePartyJob(partyId: string, jobId: string): Promise<void> {
		await this.request(`/parties/${partyId}/jobs`, {
			method: 'PUT',
			body: {
				job_id: jobId
			}
		})
		// Clear party cache to reflect the change
		this.clearCache(`/parties/${partyId}`)
	}

	/**
	 * Updates job skills for a party
	 * @param partyId The party's ID (UUID)
	 * @param skills Array of skill assignments with slot positions
	 */
	async updatePartyJobSkills(
		partyId: string,
		skills: Array<{ id: string; slot: number }>
	): Promise<void> {
		// Convert skills array to Rails expected format
		const party: Record<string, string | null> = {}

		// Initialize all slots with null
		for (let i = 1; i <= 4; i++) {
			party[`skill${i}_id`] = null
		}

		// Set the provided skills
		skills.forEach(skill => {
			// Rails expects skill1_id, skill2_id, skill3_id, skill4_id
			party[`skill${skill.slot + 1}_id`] = skill.id
		})

		await this.request(`/parties/${partyId}/job_skills`, {
			method: 'PUT',
			body: { party }
		})
		// Clear party cache to reflect the change
		this.clearCache(`/parties/${partyId}`)
	}

	/**
	 * Removes a job skill from a party
	 * @param partyId The party's ID (UUID)
	 * @param slot The skill slot to clear (0-3)
	 */
	async removePartyJobSkill(partyId: string, slot: number): Promise<void> {
		await this.request(`/parties/${partyId}/job_skills`, {
			method: 'DELETE',
			body: { slot }
		})
		// Clear party cache to reflect the change
		this.clearCache(`/parties/${partyId}`)
	}

	// ============================================
	// Job Accessory Methods (Database Management)
	// ============================================

	/**
	 * Gets all job accessories
	 * @param accessoryType Optional filter by type (1=Shield, 2=Manatura)
	 */
	async getAllAccessories(accessoryType?: number): Promise<JobAccessory[]> {
		const params = accessoryType ? `?accessory_type=${accessoryType}` : ''
		return this.request<JobAccessory[]>(`/job_accessories${params}`)
	}

	/**
	 * Gets a single job accessory by ID or granblue_id
	 */
	async getAccessoryById(id: string): Promise<JobAccessory> {
		return this.request<JobAccessory>(`/job_accessories/${id}`)
	}

	/**
	 * Creates a new job accessory
	 * @param data The accessory data
	 */
	async createAccessory(data: JobAccessoryPayload): Promise<JobAccessory> {
		const response = await this.request<JobAccessory>('/job_accessories', {
			method: 'POST',
			body: data
		})
		this.clearCache('/job_accessories')
		return response
	}

	/**
	 * Updates an existing job accessory
	 * @param id The accessory's ID or granblue_id
	 * @param data The updated accessory data
	 */
	async updateAccessory(id: string, data: Partial<JobAccessoryPayload>): Promise<JobAccessory> {
		const response = await this.request<JobAccessory>(`/job_accessories/${id}`, {
			method: 'PUT',
			body: data
		})
		this.clearCache('/job_accessories')
		this.clearCache(`/job_accessories/${id}`)
		return response
	}

	/**
	 * Deletes a job accessory
	 * @param id The accessory's ID or granblue_id
	 */
	async deleteAccessory(id: string): Promise<void> {
		await this.request(`/job_accessories/${id}`, {
			method: 'DELETE'
		})
		this.clearCache('/job_accessories')
	}

	/**
	 * Clears the cache for job-related data
	 */
	clearJobCache() {
		this.clearCache('/jobs')
		this.clearCache('/search/job_skills')
		this.clearCache('/job_accessories')
	}
}

/**
 * Default job adapter instance
 */
export const jobAdapter = new JobAdapter(DEFAULT_ADAPTER_CONFIG)