/**
 * Role Adapter
 *
 * Editor-only CRUD for the character role catalog plus icon upload and bulk
 * reorder. The route surface lives at /api/v1/grid_character_roles.
 *
 * @module adapters/role
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Role } from '$lib/types/api/party'

export interface RolePayload {
	nameEn: string
	nameJp?: string | null
	sortOrder?: number | null
}

export interface ReorderEntry {
	id: string
	sortOrder: number
}

const BASE = '/grid_character_roles'

export class RoleAdapter extends BaseAdapter {
	async listRoles(): Promise<Role[]> {
		return this.request<Role[]>(BASE, { method: 'GET' })
	}

	async getRole(id: string): Promise<Role> {
		return this.request<Role>(`${BASE}/${id}`)
	}

	async createRole(payload: RolePayload, headers?: Record<string, string>): Promise<Role> {
		return this.request<Role>(BASE, {
			method: 'POST',
			body: { grid_character_role: payload },
			headers
		})
	}

	async updateRole(
		id: string,
		payload: Partial<RolePayload>,
		headers?: Record<string, string>
	): Promise<Role> {
		return this.request<Role>(`${BASE}/${id}`, {
			method: 'PUT',
			body: { grid_character_role: payload },
			headers
		})
	}

	async deleteRole(id: string, headers?: Record<string, string>): Promise<void> {
		return this.request<void>(`${BASE}/${id}`, {
			method: 'DELETE',
			headers
		})
	}

	async reorderRoles(entries: ReorderEntry[], headers?: Record<string, string>): Promise<Role[]> {
		return this.request<Role[]>(`${BASE}/reorder`, {
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
		return this.request<Role>(`${BASE}/${id}/upload_icon`, {
			method: 'POST',
			body: { image: base64Image, filename },
			headers
		})
	}
}

export const roleAdapter = new RoleAdapter(DEFAULT_ADAPTER_CONFIG)
