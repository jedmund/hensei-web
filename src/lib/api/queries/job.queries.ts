/**
 * Job Query Options Factory
 *
 * Provides type-safe, reusable query configurations for job operations
 * using TanStack Query v6 patterns.
 *
 * @module api/queries/job
 */

import { queryOptions, infiniteQueryOptions } from '@tanstack/svelte-query'
import {
	jobAdapter,
	type SearchJobSkillsParams
} from '$lib/api/adapters/job.adapter'
import type { Job, JobSkill, JobAccessory } from '$lib/types/api/entities'

/**
 * Standard page result format for job skill infinite queries
 */
export interface JobSkillPageResult {
	results: JobSkill[]
	page: number
	totalPages: number
	total: number
}

/**
 * Job query options factory
 *
 * Provides query configurations for all job-related operations.
 * These can be used with `createQuery`, `createInfiniteQuery`, or for prefetching.
 *
 * @example
 * ```typescript
 * import { createQuery, createInfiniteQuery } from '@tanstack/svelte-query'
 * import { jobQueries } from '$lib/api/queries/job.queries'
 *
 * // All jobs
 * const jobs = createQuery(() => jobQueries.list())
 *
 * // Skills for a specific job with infinite scroll
 * const skills = createInfiniteQuery(() => jobQueries.skills(jobId, { query: searchTerm }))
 * ```
 */
export const jobQueries = {
	/**
	 * All jobs list query options
	 *
	 * @returns Query options for fetching all jobs
	 */
	list: () =>
		queryOptions({
			queryKey: ['jobs'] as const,
			queryFn: () => jobAdapter.getAll(),
			staleTime: 1000 * 60 * 30, // 30 minutes - jobs rarely change
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	/**
	 * Single job query options
	 *
	 * @param id - Job ID
	 * @returns Query options for fetching a single job
	 */
	byId: (id: string) =>
		queryOptions({
			queryKey: ['jobs', id] as const,
			queryFn: () => jobAdapter.getById(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	/**
	 * Job skills query options (non-paginated)
	 *
	 * @param jobId - Job ID to fetch skills for
	 * @returns Query options for fetching all skills for a job
	 */
	skillsByJob: (jobId: string) =>
		queryOptions({
			queryKey: ['jobs', jobId, 'skills'] as const,
			queryFn: () => jobAdapter.getSkills(jobId),
			enabled: !!jobId,
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	/**
	 * EMP skills from other jobs (for party skill selection)
	 *
	 * @param jobId - Current job ID to find compatible EMP skills for
	 * @returns Query options for fetching EMP skills from other jobs
	 */
	empSkills: (jobId: string) =>
		queryOptions({
			queryKey: ['jobs', jobId, 'emp_skills'] as const,
			queryFn: () => jobAdapter.getEmpSkills(jobId),
			enabled: !!jobId,
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	/**
	 * Job skills search infinite query options
	 *
	 * @param jobId - Job ID to search skills for
	 * @param params - Optional search parameters (query, filters, locale)
	 * @returns Infinite query options for searching job skills
	 */
	skills: (
		jobId: string,
		params?: Omit<SearchJobSkillsParams, 'jobId' | 'page'>
	) =>
		infiniteQueryOptions({
			queryKey: ['jobs', jobId, 'skills', 'search', params] as const,
			queryFn: async ({ pageParam }): Promise<JobSkillPageResult> => {
				const response = await jobAdapter.searchSkills({
					jobId,
					...params,
					page: pageParam
				})
				return {
					results: response.results,
					page: response.page,
					totalPages: response.totalPages,
					total: response.total
				}
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage) => {
				if (lastPage.page < lastPage.totalPages) {
					return lastPage.page + 1
				}
				return undefined
			},
			enabled: !!jobId,
			staleTime: 1000 * 60 * 5, // 5 minutes - search results can change
			gcTime: 1000 * 60 * 15 // 15 minutes
		}),

	/**
	 * Job accessories query options (for a specific job)
	 *
	 * @param jobId - Job ID to fetch accessories for
	 * @returns Query options for fetching job accessories
	 */
	accessoriesForJob: (jobId: string) =>
		queryOptions({
			queryKey: ['jobs', jobId, 'accessories'] as const,
			queryFn: () => jobAdapter.getAccessoriesForJob(jobId),
			enabled: !!jobId,
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	/**
	 * All job skills query options (not filtered by job)
	 *
	 * @returns Query options for fetching all job skills
	 */
	allSkills: () =>
		queryOptions({
			queryKey: ['jobs', 'skills', 'all'] as const,
			queryFn: () => jobAdapter.getAllSkills(),
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	// ============================================
	// Job Accessory Database Queries
	// ============================================

	/**
	 * All job accessories list query options
	 *
	 * @param accessoryType - Optional filter by type (1=Shield, 2=Manatura)
	 * @returns Query options for fetching all job accessories
	 */
	accessoriesList: (accessoryType?: number) =>
		queryOptions({
			queryKey: ['jobAccessories', { accessoryType }] as const,
			queryFn: () => jobAdapter.getAllAccessories(accessoryType),
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		}),

	/**
	 * Single job accessory query options
	 *
	 * @param id - Accessory ID or granblue_id
	 * @returns Query options for fetching a single accessory
	 */
	accessoryById: (id: string) =>
		queryOptions({
			queryKey: ['jobAccessories', id] as const,
			queryFn: () => jobAdapter.getAccessoryById(id),
			enabled: !!id,
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60 // 1 hour
		})
}

/**
 * Query key helpers for cache invalidation
 *
 * @example
 * ```typescript
 * import { useQueryClient } from '@tanstack/svelte-query'
 * import { jobKeys } from '$lib/api/queries/job.queries'
 *
 * const queryClient = useQueryClient()
 *
 * // Invalidate all jobs
 * queryClient.invalidateQueries({ queryKey: jobKeys.all })
 *
 * // Invalidate skills for a specific job
 * queryClient.invalidateQueries({ queryKey: jobKeys.skills('job-id') })
 * ```
 */
export const jobKeys = {
	all: ['jobs'] as const,
	lists: () => [...jobKeys.all] as const,
	detail: (id: string) => [...jobKeys.all, id] as const,
	skills: (jobId: string) => [...jobKeys.all, jobId, 'skills'] as const,
	empSkills: (jobId: string) => [...jobKeys.all, jobId, 'emp_skills'] as const,
	skillsSearch: (jobId: string, params?: Omit<SearchJobSkillsParams, 'jobId' | 'page'>) =>
		[...jobKeys.skills(jobId), 'search', params] as const,
	accessoriesForJob: (jobId: string) => [...jobKeys.all, jobId, 'accessories'] as const,
	allSkills: () => [...jobKeys.all, 'skills', 'all'] as const
}

/**
 * Job accessory query key helpers for cache invalidation
 */
export const jobAccessoryKeys = {
	all: ['jobAccessories'] as const,
	lists: (accessoryType?: number) => [...jobAccessoryKeys.all, { accessoryType }] as const,
	detail: (id: string) => [...jobAccessoryKeys.all, id] as const
}
