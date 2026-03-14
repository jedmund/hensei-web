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
	GridArtifactUpdateInput
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
	proficiency?: number | number[]
	rarity?: 'standard' | 'quirk'
	// Skill filters - each slot accepts array of modifier IDs (OR logic within slot, AND across slots)
	skill1?: number[]
	skill2?: number[]
	skill3?: number[]
	skill4?: number[]
	sort?: string
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
	 */
	async listArtifacts(params?: ArtifactListParams): Promise<Artifact[]> {
		const response = await this.request<{ artifacts: Artifact[] }>('/artifacts', {
			query: params
		})
		return response.artifacts
	}

	/**
	 * Gets a single artifact by ID
	 */
	async getArtifact(id: string): Promise<Artifact> {
		return this.request<Artifact>(`/artifacts/${id}`)
	}

	/**
	 * Lists all artifact skills
	 */
	async listSkills(): Promise<ArtifactSkill[]> {
		const response = await this.request<{ artifactSkills: ArtifactSkill[] }>('/artifact_skills')
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
				query: { group }
			}
		)
		return response.artifactSkills
	}

	/**
	 * Gets a single artifact skill by ID
	 */
	async getSkill(id: string): Promise<ArtifactSkill> {
		return this.request<ArtifactSkill>(`/artifact_skills/${id}`)
	}

	/**
	 * Updates an artifact skill
	 */
	async updateSkill(
		id: string,
		data: Partial<{
			name_en: string
			name_jp: string
			game_name_en: string
			game_name_jp: string
			skill_group: number
			modifier: number
			polarity: string
			base_values: (number | null)[]
			growth: number
			suffix_en: string
			suffix_jp: string
		}>
	): Promise<ArtifactSkill> {
		const response = await this.request<ArtifactSkill>(`/artifact_skills/${id}`, {
			method: 'PATCH',
			body: data
		})
		this.clearCache('/artifact_skills')
		this.clearCache(`/artifact_skills/${id}`)
		return response
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

	/**
	 * Deletes multiple collection artifacts in a single batch request
	 */
	async deleteCollectionArtifactsBatch(ids: string[]): Promise<{ deleted: number }> {
		if (ids.length === 0) return { deleted: 0 }

		const response = await this.request<{
			meta: { deleted: number }
		}>('/collection/artifacts/batch_destroy', {
			method: 'DELETE',
			body: { ids }
		})

		return response.meta
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
						skill4: input.skill4,
						collectionArtifactId: input.collectionArtifactId
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
	 * Syncs a grid artifact from its linked collection source
	 */
	async syncGridArtifact(id: string): Promise<GridArtifact> {
		const response = await this.request<{ gridArtifact: GridArtifact }>(`/grid_artifacts/${id}/sync`, {
			method: 'POST'
		})
		return response.gridArtifact
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
