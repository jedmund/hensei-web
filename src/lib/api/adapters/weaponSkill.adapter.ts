/**
 * Weapon Skill Adapter
 *
 * Admin editor endpoints for weapon skill families: skill data, effects,
 * versions, shared skill labels and calculator panel validation.
 *
 * @module adapters/weaponSkill
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type {
	DeleteImpact,
	PanelValidation,
	WeaponSkillFamily,
	WeaponSkillFamilySummary
} from '$lib/types/api/weaponSkillFamily'

/**
 * Adapter for the weapon skill family editor
 */
export class WeaponSkillAdapter extends BaseAdapter {
	async getWeaponSkillFamilies(filters?: {
		q?: string
		series?: string
		size?: string
		boostType?: string
	}): Promise<WeaponSkillFamilySummary[]> {
		const query = new URLSearchParams()
		if (filters?.q) query.set('q', filters.q)
		if (filters?.series) query.set('series', filters.series)
		if (filters?.size) query.set('size', filters.size)
		if (filters?.boostType) query.set('boost_type', filters.boostType)
		const qs = query.size > 0 ? `?${query.toString()}` : ''
		const response = await this.request<{ weaponSkillFamilies: WeaponSkillFamilySummary[] }>(
			`/weapon_skill_families${qs}`
		)
		return response.weaponSkillFamilies
	}

	async getWeaponSkillFamily(modifier: string): Promise<WeaponSkillFamily> {
		const response = await this.request<{ weaponSkillFamily: WeaponSkillFamily }>(
			`/weapon_skill_families/${encodeURIComponent(modifier)}`
		)
		return response.weaponSkillFamily
	}

	async createWeaponSkillDatum(payload: Record<string, unknown>): Promise<unknown> {
		return this.request('/weapon_skill_data', {
			method: 'POST',
			body: { weapon_skill_datum: payload }
		})
	}

	async updateWeaponSkillDatum(id: string, payload: Record<string, unknown>): Promise<unknown> {
		return this.request(`/weapon_skill_data/${id}`, {
			method: 'PATCH',
			body: { weapon_skill_datum: payload }
		})
	}

	async deleteWeaponSkillDatum(id: string, force = false): Promise<DeleteImpact> {
		return this.request<DeleteImpact>(`/weapon_skill_data/${id}${force ? '?force=true' : ''}`, {
			method: 'DELETE'
		})
	}

	async createWeaponSkillEffect(payload: Record<string, unknown>): Promise<unknown> {
		return this.request('/weapon_skill_effects', {
			method: 'POST',
			body: { weapon_skill_effect: payload }
		})
	}

	async updateWeaponSkillEffect(id: string, payload: Record<string, unknown>): Promise<unknown> {
		return this.request(`/weapon_skill_effects/${id}`, {
			method: 'PATCH',
			body: { weapon_skill_effect: payload }
		})
	}

	async deleteWeaponSkillEffect(id: string, force = false): Promise<DeleteImpact> {
		return this.request<DeleteImpact>(`/weapon_skill_effects/${id}${force ? '?force=true' : ''}`, {
			method: 'DELETE'
		})
	}

	async updateWeaponSkillVersion(id: string, payload: Record<string, unknown>): Promise<unknown> {
		return this.request(`/weapon_skill_versions/${id}`, {
			method: 'PATCH',
			body: { weapon_skill_version: payload }
		})
	}

	async updateSkillLabels(
		id: string,
		payload: {
			name_en?: string
			name_jp?: string
			description_en?: string
			description_jp?: string
		}
	): Promise<{ sharedByCount: number }> {
		return this.request<{ sharedByCount: number }>(`/skills/${id}`, {
			method: 'PATCH',
			body: { skill: payload }
		})
	}

	async validatePanels(): Promise<PanelValidation> {
		return this.request<PanelValidation>('/calculator/validate_panels', { method: 'POST' })
	}
}

export const weaponSkillAdapter = new WeaponSkillAdapter(DEFAULT_ADAPTER_CONFIG)
