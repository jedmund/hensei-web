import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { DifficultyTier } from '$lib/types/api/party'

export interface PendingMeta {
	pending?: boolean
	pendingOperation?: 'create' | 'update' | 'destroy' | null
	draftId?: string | null
}

export interface DifficultyRule extends PendingMeta {
	id: string
	name: string
	description?: string | null
	component: string
	ruleType: string
	params: Record<string, unknown>
	weight: number
	active: boolean
	createdAt?: string
	updatedAt?: string
}

export interface DifficultyComponent extends PendingMeta {
	id: string
	name: string
	weight: number
	enabled: boolean
	minCountToScore: number
	/** Optional cap on the denominator used for raw_score. When null the
	 * calculator falls back to summing every rule's max contribution. */
	targetMax: number | null
	createdAt?: string
	updatedAt?: string
}

export interface DifficultyPreviewResult {
	shortcode: string
	scoreable: boolean
	score: number | null
	tier: DifficultyTier | null
	breakdown: Record<string, unknown> | null
	rulesetVersion: number
	withDrafts?: boolean
}

export type DraftOperation = 'create' | 'update' | 'destroy'
export type DraftTargetType = 'Difficulty' | 'DifficultyRule' | 'DifficultyComponent'

export interface DifficultyDraft {
	id: string
	targetType: DraftTargetType
	targetId: string | null
	operation: DraftOperation
	attributes: Record<string, unknown>
	createdAt?: string
	updatedAt?: string
}

export interface DraftSection {
	creates: Array<{ draftId: string; attributes: Record<string, unknown> }>
	updates: Array<{
		draftId: string
		targetId: string
		label: string
		changes: Record<string, { old: unknown; new: unknown }>
	}>
	destroys: Array<{
		draftId: string
		targetId: string
		label: string
		snapshot: Record<string, unknown>
	}>
}

export interface DifficultyDiff {
	tiers: DraftSection
	rules: DraftSection
	components: DraftSection
}

export interface CommitResult {
	rulesetVersionAfter: number
	committedAt: string
	note: string | null
	changeLogId: string
}

export interface DifficultyRuleTypes {
	types: string[]
	grouped: Record<string, string[]>
}

/**
 * Adapter for the party difficulty scoring system.
 *
 * Editor endpoints (rules, components, preview) require role >= 7.
 */
export class DifficultyAdapter extends BaseAdapter {
	// ==================== Tiers (public read) ====================

	async listTiers(options?: RequestOptions & { withDrafts?: boolean }): Promise<DifficultyTier[]> {
		const query = options?.withDrafts ? { with_drafts: true } : undefined
		return this.request<DifficultyTier[]>('/difficulties', { ...options, query })
	}

	async createTier(
		input: Partial<DifficultyTier>,
		options?: RequestOptions
	): Promise<{ draft: DifficultyDraft }> {
		const response = await this.request<{ draft: DifficultyDraft }>('/difficulties', {
			...options,
			method: 'POST',
			body: JSON.stringify({ difficulty: input })
		})
		this.clearCache('/difficulties')
		return response
	}

	async updateTier(
		id: string,
		input: Partial<DifficultyTier>,
		options?: RequestOptions
	): Promise<{ draft: DifficultyDraft }> {
		const response = await this.request<{ draft: DifficultyDraft }>(`/difficulties/${id}`, {
			...options,
			method: 'PUT',
			body: JSON.stringify({ difficulty: input })
		})
		this.clearCache('/difficulties')
		return response
	}

	async deleteTier(id: string, options?: RequestOptions): Promise<void> {
		await this.request<void>(`/difficulties/${id}`, {
			...options,
			method: 'DELETE'
		})
		this.clearCache('/difficulties')
	}

	// ==================== Components (editor only) ====================

	async listComponents(
		options?: RequestOptions & { withDrafts?: boolean }
	): Promise<DifficultyComponent[]> {
		const query = options?.withDrafts ? { with_drafts: true } : undefined
		return this.request<DifficultyComponent[]>('/difficulty_components', { ...options, query })
	}

	async updateComponent(
		idOrName: string,
		input: Partial<DifficultyComponent>,
		options?: RequestOptions
	): Promise<{ draft: DifficultyDraft }> {
		const response = await this.request<{ draft: DifficultyDraft }>(
			`/difficulty_components/${idOrName}`,
			{
				...options,
				method: 'PUT',
				body: JSON.stringify({ difficulty_component: input })
			}
		)
		this.clearCache('/difficulty_components')
		return response
	}

	// ==================== Rules (editor only) ====================

	async listRules(
		filters?: { component?: string; active?: boolean; withDrafts?: boolean },
		options?: RequestOptions
	): Promise<DifficultyRule[]> {
		const query: Record<string, string | boolean> = {}
		if (filters?.component) query.component = filters.component
		if (filters?.active !== undefined) query.active = filters.active
		if (filters?.withDrafts) query.with_drafts = true
		return this.request<DifficultyRule[]>('/difficulty_rules', {
			...options,
			query: Object.keys(query).length > 0 ? query : undefined
		})
	}

	async getRuleTypes(options?: RequestOptions): Promise<DifficultyRuleTypes> {
		return this.request<DifficultyRuleTypes>('/difficulty_rules/types', options)
	}

	async createRule(
		input: Partial<DifficultyRule>,
		options?: RequestOptions
	): Promise<{ draft: DifficultyDraft }> {
		const response = await this.request<{ draft: DifficultyDraft }>('/difficulty_rules', {
			...options,
			method: 'POST',
			body: JSON.stringify({ difficulty_rule: input })
		})
		this.clearCache('/difficulty_rules')
		return response
	}

	async updateRule(
		id: string,
		input: Partial<DifficultyRule>,
		options?: RequestOptions
	): Promise<{ draft: DifficultyDraft }> {
		const response = await this.request<{ draft: DifficultyDraft }>(`/difficulty_rules/${id}`, {
			...options,
			method: 'PUT',
			body: JSON.stringify({ difficulty_rule: input })
		})
		this.clearCache('/difficulty_rules')
		return response
	}

	async deleteRule(id: string, options?: RequestOptions): Promise<void> {
		await this.request<void>(`/difficulty_rules/${id}`, {
			...options,
			method: 'DELETE'
		})
		this.clearCache('/difficulty_rules')
	}

	// ==================== Preview (editor only) ====================

	async preview(shortcode: string, options?: RequestOptions): Promise<DifficultyPreviewResult> {
		return this.request<DifficultyPreviewResult>('/difficulty_previews', {
			...options,
			method: 'POST',
			body: JSON.stringify({ shortcode })
		})
	}

	// ==================== Drafts (editor only) ====================

	async listDrafts(options?: RequestOptions): Promise<{
		drafts: DifficultyDraft[]
		pendingCount: number
	}> {
		return this.request('/difficulty_drafts', options)
	}

	async getDiff(options?: RequestOptions): Promise<{ diff: DifficultyDiff; pendingCount: number }> {
		return this.request('/difficulty_drafts/diff', options)
	}

	async stageDraft(
		input: {
			targetType: DraftTargetType
			targetId: string | null
			operation: DraftOperation
			attributes: Record<string, unknown>
		},
		options?: RequestOptions
	): Promise<DifficultyDraft> {
		return this.request<DifficultyDraft>('/difficulty_drafts', {
			...options,
			method: 'POST',
			body: JSON.stringify({ draft: input })
		})
	}

	async deleteDraft(id: string, options?: RequestOptions): Promise<void> {
		await this.request<void>(`/difficulty_drafts/${id}`, { ...options, method: 'DELETE' })
	}

	async discardDrafts(options?: RequestOptions): Promise<{ discarded: number }> {
		return this.request('/difficulty_drafts/all', { ...options, method: 'DELETE' })
	}

	async commitDrafts(note: string, options?: RequestOptions): Promise<CommitResult> {
		return this.request<CommitResult>('/difficulty_drafts/commit', {
			...options,
			method: 'POST',
			body: JSON.stringify({ note })
		})
	}
}

export const difficultyAdapter = new DifficultyAdapter(DEFAULT_ADAPTER_CONFIG)
