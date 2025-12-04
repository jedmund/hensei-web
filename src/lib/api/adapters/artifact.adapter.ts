/**
 * Artifact Adapter
 *
 * Handles all artifact-related API operations including:
 * - Reference data (artifacts, skills)
 * - Collection artifacts (user inventory)
 * - Grid artifacts (equipped on characters in parties)
 * - Artifact grading
 *
 * @module adapters/artifact
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions, PaginatedResponse } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	Artifact,
	ArtifactSkill,
	ArtifactSkillGroup,
	CollectionArtifact,
	CollectionArtifactInput,
	GridArtifact,
	GridArtifactInput,
	GridArtifactUpdateInput,
	ArtifactGrade,
	ArtifactGradeInput
} from '$lib/types/api/artifact'

/**
 * Parameters for listing artifacts with filtering
 */
export interface ArtifactListParams {
	rarity?: 'standard' | 'quirk'
	proficiency?: number
}

/**
 * Parameters for listing collection artifacts with pagination
 */
export interface CollectionArtifactListParams {
	page?: number
	limit?: number
	element?: number | number[]
	artifactId?: string
	proficiency?: number
	rarity?: 'standard' | 'quirk'
}

/**
 * Artifact adapter for managing artifacts and skills
 */
export class ArtifactAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	// ============================================
	// Reference Data (Artifacts and Skills)
	// ============================================

	/**
	 * Lists all artifact reference data
	 * Results are cached for 1 hour
	 */
	async listArtifacts(params?: ArtifactListParams): Promise<Artifact[]> {
		const response = await this.request<{ artifacts: Artifact[] }>('/artifacts', {
			method: 'GET',
			query: params,
			cacheTime: 60 * 60 * 1000 // 1 hour
		})
		return response.artifacts
	}

	/**
	 * Gets a single artifact by ID
	 */
	async getArtifact(id: string): Promise<Artifact> {
		return this.request<Artifact>(`/artifacts/${id}`, {
			method: 'GET',
			cacheTime: 60 * 60 * 1000 // 1 hour
		})
	}

	/**
	 * Lists all artifact skills
	 * Results are cached for 1 hour
	 */
	async listSkills(): Promise<ArtifactSkill[]> {
		const response = await this.request<{ artifactSkills: ArtifactSkill[] }>('/artifact_skills', {
			method: 'GET',
			cacheTime: 60 * 60 * 1000 // 1 hour
		})
		return response.artifactSkills
	}

	/**
	 * Gets skills for a specific slot (1-4)
	 * Maps slots to skill groups:
	 * - Slots 1-2: group_i
	 * - Slot 3: group_ii
	 * - Slot 4: group_iii
	 */
	async getSkillsForSlot(slot: number): Promise<ArtifactSkill[]> {
		const groupMap: Record<number, ArtifactSkillGroup> = {
			1: 'group_i',
			2: 'group_i',
			3: 'group_ii',
			4: 'group_iii'
		}
		const group = groupMap[slot]

		if (!group) {
			throw new Error(`Invalid slot number: ${slot}. Must be 1-4.`)
		}

		const response = await this.request<{ artifactSkills: ArtifactSkill[] }>(
			'/artifact_skills',
			{
				method: 'GET',
				query: { group },
				cacheTime: 60 * 60 * 1000 // 1 hour
			}
		)
		return response.artifactSkills
	}

	// ============================================
	// Collection Artifacts
	// ============================================

	/**
	 * Lists a user's collection artifacts with optional filters
	 */
	async listCollectionArtifacts(
		userId: string,
		params: CollectionArtifactListParams = {}
	): Promise<PaginatedResponse<CollectionArtifact>> {
		const response = await this.request<{
			artifacts?: CollectionArtifact[]
			collectionArtifacts?: CollectionArtifact[]
			meta: { count: number; totalPages: number; perPage: number; currentPage: number }
		}>(`/users/${userId}/collection/artifacts`, {
			method: 'GET',
			query: params
		})

		// Handle both response key formats
		const artifacts = response.artifacts ?? response.collectionArtifacts ?? []

		return {
			results: artifacts,
			page: response.meta.currentPage,
			total: response.meta.count,
			totalPages: response.meta.totalPages,
			perPage: response.meta.perPage
		}
	}

	/**
	 * Gets a single collection artifact by ID
	 */
	async getCollectionArtifact(id: string): Promise<CollectionArtifact> {
		return this.request<CollectionArtifact>(`/collection/artifacts/${id}`, {
			method: 'GET'
		})
	}

	/**
	 * Creates a new collection artifact
	 */
	async createCollectionArtifact(input: CollectionArtifactInput): Promise<CollectionArtifact> {
		return this.request<CollectionArtifact>('/collection/artifacts', {
			method: 'POST',
			body: {
				collectionArtifact: input
			}
		})
	}

	/**
	 * Creates multiple collection artifacts in a batch
	 */
	async createCollectionArtifactsBatch(
		inputs: CollectionArtifactInput[]
	): Promise<{ artifacts: CollectionArtifact[] }> {
		if (inputs.length === 0) return { artifacts: [] }

		const response = await this.request<{
			artifacts: CollectionArtifact[]
			meta: { created: number; skipped: number; errors: any[] }
		}>('/collection/artifacts/batch', {
			method: 'POST',
			body: {
				collectionArtifacts: inputs
			}
		})

		return { artifacts: response.artifacts }
	}

	/**
	 * Updates a collection artifact
	 */
	async updateCollectionArtifact(
		id: string,
		input: Partial<CollectionArtifactInput>
	): Promise<CollectionArtifact> {
		return this.request<CollectionArtifact>(`/collection/artifacts/${id}`, {
			method: 'PATCH',
			body: {
				collectionArtifact: input
			}
		})
	}

	/**
	 * Deletes a collection artifact
	 */
	async deleteCollectionArtifact(id: string): Promise<void> {
		return this.request<void>(`/collection/artifacts/${id}`, {
			method: 'DELETE'
		})
	}

	// ============================================
	// Grid Artifacts (Equipped on Characters)
	// ============================================

	/**
	 * Creates a grid artifact and attaches it to a character
	 */
	async createGridArtifact(input: GridArtifactInput): Promise<GridArtifact> {
		return this.request<GridArtifact>(
			`/parties/${input.partyId}/grid_characters/${input.gridCharacterId}/artifact`,
			{
				method: 'POST',
				body: {
					gridArtifact: {
						artifactId: input.artifactId,
						element: input.element,
						level: input.level,
						rerollSlot: input.rerollSlot,
						proficiency: input.proficiency,
						skill1: input.skill1,
						skill2: input.skill2,
						skill3: input.skill3,
						skill4: input.skill4
					}
				}
			}
		)
	}

	/**
	 * Updates a grid artifact
	 */
	async updateGridArtifact(id: string, input: GridArtifactUpdateInput): Promise<GridArtifact> {
		return this.request<GridArtifact>(`/grid_artifacts/${id}`, {
			method: 'PATCH',
			body: {
				gridArtifact: input
			}
		})
	}

	/**
	 * Deletes a grid artifact (removes from character)
	 */
	async deleteGridArtifact(id: string): Promise<void> {
		return this.request<void>(`/grid_artifacts/${id}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Equips a collection artifact onto a character
	 * This creates a reference to the collection artifact on the grid character
	 */
	async equipCollectionArtifact(
		partyId: string,
		gridCharacterId: string,
		collectionArtifactId: string
	): Promise<GridArtifact> {
		return this.request<GridArtifact>(
			`/parties/${partyId}/grid_characters/${gridCharacterId}/artifact`,
			{
				method: 'POST',
				body: {
					collectionArtifactId
				}
			}
		)
	}

	// ============================================
	// Artifact Grading (Stateless)
	// ============================================

	/**
	 * Grades artifact skills without persisting
	 * Useful for preview/what-if scenarios
	 */
	async gradeArtifact(input: ArtifactGradeInput): Promise<ArtifactGrade> {
		return this.request<ArtifactGrade>('/artifact_skills/grade', {
			method: 'POST',
			body: input
		})
	}

	// ============================================
	// Cache Management
	// ============================================

	/**
	 * Clears artifact-related cache
	 */
	clearArtifactCache() {
		this.clearCache('/artifacts')
		this.clearCache('/artifact_skills')
		this.clearCache('/collection/artifacts')
	}
}

/**
 * Default artifact adapter instance
 */
export const artifactAdapter = new ArtifactAdapter(DEFAULT_ADAPTER_CONFIG)
