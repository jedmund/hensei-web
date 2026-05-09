/**
 * Role Adapter
 *
 * Editor-only CRUD for the Roles taxonomy plus icon upload and bulk reorder.
 *
 * @module adapters/role
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Role } from '$lib/types/api/party'

export interface RolePayload {
	nameEn: string
	nameJp?: string | null
	slotType: string
	sortOrder?: number | null
}

export interface ReorderEntry {
	id: string
	sortOrder: number
}

export class RoleAdapter extends BaseAdapter {
	async listRoles(slotType?: string): Promise<Role[]> {
		return this.request<Role[]>('/roles', {
			method: 'GET',
			params: slotType ? { slot_type: slotType } : undefined
		})
	}

	async getRole(id: string): Promise<Role> {
		return this.request<Role>(`/roles/${id}`)
	}

	async createRole(payload: RolePayload, headers?: Record<string, string>): Promise<Role> {
		return this.request<Role>('/roles', {
			method: 'POST',
			body: { role: payload },
			headers
		})
	}

	async updateRole(
		id: string,
		payload: Partial<RolePayload>,
		headers?: Record<string, string>
	): Promise<Role> {
		return this.request<Role>(`/roles/${id}`, {
			method: 'PUT',
			body: { role: payload },
			headers
		})
	}

	async deleteRole(id: string, headers?: Record<string, string>): Promise<void> {
		return this.request<void>(`/roles/${id}`, {
			method: 'DELETE',
			headers
		})
	}

	async reorderRoles(entries: ReorderEntry[], headers?: Record<string, string>): Promise<Role[]> {
		return this.request<Role[]>('/roles/reorder', {
			method: 'POST',
			body: { roles: entries },
			headers
		})
	}

	async uploadIcon(
		id: string,
		base64Image: string,
		filename: string,
		headers?: Record<string, string>
	): Promise<Role> {
		return this.request<Role>(`/roles/${id}/upload_icon`, {
			method: 'POST',
			body: { image: base64Image, filename },
			headers
		})
	}
}

export const roleAdapter = new RoleAdapter(DEFAULT_ADAPTER_CONFIG)
