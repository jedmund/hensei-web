/**
 * A user as the Database's detail holds it, and the query that loads one.
 * Kept apart from the resource definition so light pages (the overview's
 * Recently opened avatars) can share its cache without loading the definition.
 */
import { queryOptions } from '@tanstack/svelte-query'
import { adminAdapter } from '$lib/api/adapters/admin.adapter'
import { adminKeys } from '$lib/api/queries/admin.queries'
import type { AdminUserDetail } from '$lib/types/api/admin'

/** `name` titles the page and the breadcrumb */
export type UserRecord = AdminUserDetail & { name: string }

export const asUserRecord = (user: AdminUserDetail): UserRecord => ({
	...user,
	name: user.displayName || user.username
})

export const userRecordQuery = (id: string) =>
	queryOptions({
		queryKey: adminKeys.user(id),
		queryFn: () => adminAdapter.getUser(id).then(asUserRecord)
	})
