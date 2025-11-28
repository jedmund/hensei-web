/**
 * Query key factory for type-safe cache keys
 * Keys are structured hierarchically for easy invalidation
 */
export const queryKeys = {
	search: {
		all: ['search'] as const,
		weapons: (query: string, filters?: Record<string, unknown>) =>
			[...queryKeys.search.all, 'weapons', query, filters] as const,
		characters: (query: string, filters?: Record<string, unknown>) =>
			[...queryKeys.search.all, 'characters', query, filters] as const,
		summons: (query: string, filters?: Record<string, unknown>) =>
			[...queryKeys.search.all, 'summons', query, filters] as const
	},
	parties: {
		all: ['parties'] as const,
		explore: () => [...queryKeys.parties.all, 'explore'] as const,
		user: (username: string) => [...queryKeys.parties.all, 'user', username] as const
	},
	jobs: {
		all: ['jobs'] as const,
		skills: (jobId: string, query?: string, filters?: Record<string, unknown>) =>
			[...queryKeys.jobs.all, 'skills', jobId, query, filters] as const
	}
}
