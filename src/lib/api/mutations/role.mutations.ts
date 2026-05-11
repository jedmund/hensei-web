/**
 * Role Mutation Configurations
 *
 * Editor-only CRUD + reorder + icon upload, with cache invalidation.
 *
 * @module api/mutations/role
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { roleAdapter, type RolePayload, type ReorderEntry } from '$lib/api/adapters/role.adapter'
import { roleKeys } from '$lib/api/queries/role.queries'

function invalidateAll(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: roleKeys.all })
}

// ============================================================================
// Create Role
// ============================================================================

export function createRoleOptions(queryClient: QueryClient) {
	return {
		mutationFn: (payload: RolePayload) => roleAdapter.createRole(payload),
		onSuccess: () => invalidateAll(queryClient)
	}
}

export function useCreateRole() {
	const queryClient = useQueryClient()
	return createMutation(() => createRoleOptions(queryClient))
}

// ============================================================================
// Update Role
// ============================================================================

export function updateRoleOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, payload }: { id: string; payload: Partial<RolePayload> }) =>
			roleAdapter.updateRole(id, payload),
		onSuccess: () => invalidateAll(queryClient)
	}
}

export function useUpdateRole() {
	const queryClient = useQueryClient()
	return createMutation(() => updateRoleOptions(queryClient))
}

// ============================================================================
// Delete Role
// ============================================================================

export function deleteRoleOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id }: { id: string }) => roleAdapter.deleteRole(id),
		onSuccess: () => invalidateAll(queryClient)
	}
}

export function useDeleteRole() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteRoleOptions(queryClient))
}

// ============================================================================
// Reorder Roles
// ============================================================================

export function reorderRolesOptions(queryClient: QueryClient) {
	return {
		mutationFn: (entries: ReorderEntry[]) => roleAdapter.reorderRoles(entries),
		onSuccess: () => invalidateAll(queryClient)
	}
}

export function useReorderRoles() {
	const queryClient = useQueryClient()
	return createMutation(() => reorderRolesOptions(queryClient))
}

// ============================================================================
// Upload Icon
// ============================================================================

export function uploadRoleIconOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, image, filename }: { id: string; image: string; filename: string }) =>
			roleAdapter.uploadIcon(id, image, filename),
		onSuccess: () => invalidateAll(queryClient)
	}
}

export function useUploadRoleIcon() {
	const queryClient = useQueryClient()
	return createMutation(() => uploadRoleIconOptions(queryClient))
}
