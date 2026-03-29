/**
 * Substitution Adapter
 *
 * Handles substitution CRUD and role fetching operations.
 *
 * @module adapters/substitution
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Role, Substitution } from '$lib/types/api/party'

export interface CreateSubstitutionParams {
	partyId: string
	gridType: string
	gridId: string
	itemId: string
	position?: number
}

export interface UpdateSubstitutionParams {
	partyId: string
	position: number
}

export class SubstitutionAdapter extends BaseAdapter {
	async fetchRoles(slotType: string): Promise<Role[]> {
		return this.request<Role[]>('/roles', {
			method: 'GET',
			params: { slot_type: slotType }
		})
	}

	async createSubstitution(
		params: CreateSubstitutionParams,
		headers?: Record<string, string>
	): Promise<Substitution> {
		return this.request<Substitution>('/substitutions', {
			method: 'POST',
			body: {
				substitution: {
					partyId: params.partyId,
					gridType: params.gridType,
					gridId: params.gridId,
					itemId: params.itemId,
					position: params.position
				}
			},
			headers
		})
	}

	async updateSubstitution(
		id: string,
		params: UpdateSubstitutionParams,
		headers?: Record<string, string>
	): Promise<Substitution> {
		return this.request<Substitution>(`/substitutions/${id}`, {
			method: 'PUT',
			body: {
				substitution: {
					partyId: params.partyId,
					position: params.position
				}
			},
			headers
		})
	}

	async deleteSubstitution(
		id: string,
		partyId: string,
		headers?: Record<string, string>
	): Promise<void> {
		return this.request<void>(`/substitutions/${id}`, {
			method: 'DELETE',
			body: {
				substitution: {
					partyId
				}
			},
			headers
		})
	}
}

export const substitutionAdapter = new SubstitutionAdapter(DEFAULT_ADAPTER_CONFIG)
