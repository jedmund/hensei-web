/**
 * Admin Adapter
 *
 * Paged, filterable, sortable lists of catalogue records for the database
 * section. Editors only; the API enforces the role.
 *
 * @module adapters/admin
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type {
	AdminListParams,
	AdminListResponse,
	AdminResource,
	AdminUserCrew,
	AdminUserDetail
} from '$lib/types/api/admin'

/**
 * Flattens list params into the API's bracketed query keys. Keys are already
 * snake_case, so BaseAdapter's camelCase → snake_case pass leaves them alone.
 */
export function toAdminListQuery(params: AdminListParams): Record<string, string> {
	const query: Record<string, string> = {}
	if (params.q) query.q = params.q
	for (const [key, value] of Object.entries(params.filters ?? {})) {
		if (Array.isArray(value)) {
			if (value.length > 0) query[`filter[${key}]`] = value.join(',')
		} else if (typeof value === 'boolean') {
			query[`filter[${key}]`] = String(value)
		} else {
			if (value.gte) query[`filter[${key}][gte]`] = value.gte
			if (value.lte) query[`filter[${key}][lte]`] = value.lte
		}
	}
	if (params.sort) query.sort = params.sort
	query.page = String(params.page)
	query.per = String(params.per)
	if (params.fields && params.fields.length > 0) query.fields = params.fields.join(',')
	if (params.facets && params.facets.length > 0) query.facets = params.facets.join(',')
	return query
}

/**
 * The admin endpoint for a resource. Route segments are kebab-case
 * (`job-skills`), Rails resources snake_case (`/admin/job_skills`).
 */
export function adminPath(resource: AdminResource): string {
	return `/admin/${resource.replaceAll('-', '_')}`
}

export class AdminAdapter extends BaseAdapter {
	async list<T>(
		resource: AdminResource,
		params: AdminListParams,
		options?: RequestOptions
	): Promise<AdminListResponse<T>> {
		const response = await this.request<Partial<AdminListResponse<T>>>(adminPath(resource), {
			...options,
			query: toAdminListQuery(params)
		})
		const meta = response.meta
		return {
			results: response.results ?? [],
			meta: {
				total: meta?.total ?? 0,
				page: meta?.page ?? params.page,
				per: meta?.per ?? params.per,
				totalPages: Math.max(meta?.totalPages ?? 1, 1)
			},
			facets: response.facets ?? {}
		}
	}

	listWeapons<T>(params: AdminListParams, options?: RequestOptions) {
		return this.list<T>('weapons', params, options)
	}

	/** A user's profile, role and access history (admins only) */
	getUser(id: string, options?: RequestOptions): Promise<AdminUserDetail> {
		return this.request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`, options)
	}

	/** Every crew, for the Users list's Crew filter (admins only) */
	listUserCrews(options?: RequestOptions): Promise<AdminUserCrew[]> {
		return this.request<AdminUserCrew[]>('/admin/users/crews', options)
	}

	/** Sets a user's role (user, curator or editor); resolves with the updated user */
	updateUserRole(id: string, role: number): Promise<AdminUserDetail> {
		return this.request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}/role`, {
			method: 'PATCH',
			body: { role }
		})
	}
}

export const adminAdapter = new AdminAdapter(DEFAULT_ADAPTER_CONFIG)
