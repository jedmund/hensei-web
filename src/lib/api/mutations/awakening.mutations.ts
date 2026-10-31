import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import {
	awakeningAdapter,
	type CreateAwakeningPayload,
	type UpdateAwakeningPayload
} from '$lib/api/adapters/awakening.adapter'
import { entityKeys } from '$lib/api/queries/entity.queries'

export function createAwakeningOptions(queryClient: QueryClient) {
	return {
		mutationFn: (payload: CreateAwakeningPayload) => awakeningAdapter.createAwakening(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.allAwakenings() })
		}
	}
}

export function updateAwakeningOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, payload }: { id: string; payload: UpdateAwakeningPayload }) =>
			awakeningAdapter.updateAwakening(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.allAwakenings() })
		}
	}
}

export function deleteAwakeningOptions(queryClient: QueryClient) {
	return {
		mutationFn: (id: string) => awakeningAdapter.deleteAwakening(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.allAwakenings() })
		}
	}
}

export function uploadAwakeningImageOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			id,
			imageData,
			filename
		}: {
			id: string
			imageData: string
			filename: string
		}) => awakeningAdapter.uploadAwakeningImage(id, imageData, filename),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.allAwakenings() })
		}
	}
}

export function useCreateAwakening() {
	const queryClient = useQueryClient()
	return createMutation(() => createAwakeningOptions(queryClient))
}

export function useUpdateAwakening() {
	const queryClient = useQueryClient()
	return createMutation(() => updateAwakeningOptions(queryClient))
}

export function useDeleteAwakening() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteAwakeningOptions(queryClient))
}

export function useUploadAwakeningImage() {
	const queryClient = useQueryClient()
	return createMutation(() => uploadAwakeningImageOptions(queryClient))
}
