import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { DifficultyTier } from '$lib/types/api/party'

export interface DifficultyRule {
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

export interface DifficultyComponent {
	id: string
	name: string
	weight: number
	enabled: boolean
	minCountToScore: number
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

	async listTiers(options?: RequestOptions): Promise<DifficultyTier[]> {
		return this.request<DifficultyTier[]>('/difficulties', options)
	}

	async createTier(
		input: Partial<DifficultyTier>,
		options?: RequestOptions
	): Promise<DifficultyTier> {
		const response = await this.request<DifficultyTier>('/difficulties', {
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
	): Promise<DifficultyTier> {
		const response = await this.request<DifficultyTier>(`/difficulties/${id}`, {
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

	async listComponents(options?: RequestOptions): Promise<DifficultyComponent[]> {
		return this.request<DifficultyComponent[]>('/difficulty_components', options)
	}

	async updateComponent(
		idOrName: string,
		input: Partial<DifficultyComponent>,
		options?: RequestOptions
	): Promise<DifficultyComponent> {
		const response = await this.request<DifficultyComponent>(`/difficulty_components/${idOrName}`, {
			...options,
			method: 'PUT',
			body: JSON.stringify({ difficulty_component: input })
		})
		this.clearCache('/difficulty_components')
		return response
	}

	// ==================== Rules (editor only) ====================

	async listRules(
		filters?: { component?: string; active?: boolean },
		options?: RequestOptions
	): Promise<DifficultyRule[]> {
		const query: Record<string, string | boolean> = {}
		if (filters?.component) query.component = filters.component
		if (filters?.active !== undefined) query.active = filters.active
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
	): Promise<DifficultyRule> {
		const response = await this.request<DifficultyRule>('/difficulty_rules', {
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
	): Promise<DifficultyRule> {
		const response = await this.request<DifficultyRule>(`/difficulty_rules/${id}`, {
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
}

export const difficultyAdapter = new DifficultyAdapter(DEFAULT_ADAPTER_CONFIG)
