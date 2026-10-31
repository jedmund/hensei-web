/**
 * Awakening Adapter
 *
 * Awakenings for weapons and characters: listing, editor CRUD and image upload.
 *
 * @module adapters/awakening
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Awakening } from '$lib/types/api/entities'

/**
 * Payload for creating a new awakening
 */
export interface CreateAwakeningPayload {
	name_en: string
	name_jp?: string
	slug: string
	object_type: string
	order?: number
}

/**
 * Payload for updating an awakening
 */
export interface UpdateAwakeningPayload {
	name_en?: string
	name_jp?: string
	slug?: string
	object_type?: string
	order?: number
}

/**
 * Adapter for awakenings
 */
export class AwakeningAdapter extends BaseAdapter {
	/**
	 * Gets all awakenings, optionally filtered by object_type
	 */
	async getAwakenings(objectType?: string): Promise<Awakening[]> {
		const params = objectType ? `?object_type=${objectType}` : ''
		return this.request<Awakening[]>(`/awakenings${params}`, {
			method: 'GET'
		})
	}

	/**
	 * Gets a single awakening by ID
	 */
	async getAwakening(id: string): Promise<Awakening> {
		return this.request<Awakening>(`/awakenings/${id}`, {
			method: 'GET'
		})
	}

	/**
	 * Creates a new awakening
	 * Requires editor role (>= 7)
	 */
	async createAwakening(payload: CreateAwakeningPayload): Promise<Awakening> {
		return this.request<Awakening>('/awakenings', {
			method: 'POST',
			body: { awakening: payload }
		})
	}

	/**
	 * Updates an existing awakening
	 * Requires editor role (>= 7)
	 */
	async updateAwakening(id: string, payload: UpdateAwakeningPayload): Promise<Awakening> {
		return this.request<Awakening>(`/awakenings/${id}`, {
			method: 'PATCH',
			body: { awakening: payload }
		})
	}

	/**
	 * Deletes an awakening
	 * Requires editor role (>= 7)
	 */
	async deleteAwakening(id: string): Promise<void> {
		await this.request<void>(`/awakenings/${id}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Uploads an image for an awakening
	 * Requires editor role (>= 7)
	 */
	async uploadAwakeningImage(id: string, imageData: string, filename: string): Promise<Awakening> {
		return this.request<Awakening>(`/awakenings/${id}/upload_image`, {
			method: 'POST',
			body: { image: imageData, filename }
		})
	}
}

export const awakeningAdapter = new AwakeningAdapter(DEFAULT_ADAPTER_CONFIG)
