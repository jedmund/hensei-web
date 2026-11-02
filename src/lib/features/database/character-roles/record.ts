/**
 * The role record the detail and edit pages load: the role JSON with its
 * names as a pair too, which the detail header and the name field read.
 */
import { queryOptions } from '@tanstack/svelte-query'
import { roleAdapter } from '$lib/api/adapters/role.adapter'
import { roleKeys } from '$lib/api/queries/role.queries'
import type { Role } from '$lib/types/api/party'

export type RoleRecord = Role & { name: { en: string; ja: string } }

export function toRoleRecord(role: Role): RoleRecord {
	return { ...role, name: { en: role.nameEn, ja: role.nameJp ?? '' } }
}

export function fetchRoleRecord(id: string): Promise<RoleRecord> {
	return roleAdapter.getRole(id).then(toRoleRecord)
}

export function roleRecordQuery(id: string) {
	return queryOptions({
		queryKey: roleKeys.detail(id),
		queryFn: () => fetchRoleRecord(id),
		enabled: !!id,
		staleTime: 1000 * 60 * 5
	})
}
