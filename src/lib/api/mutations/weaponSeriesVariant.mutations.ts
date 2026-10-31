import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { seriesAdapter } from '$lib/api/adapters/series.adapter'
import type {
	CreateWeaponSeriesVariantPayload,
	UpdateWeaponSeriesVariantPayload
} from '$lib/types/api/weaponSeriesVariant'
import { entityKeys } from '$lib/api/queries/entity.queries'

export function createWeaponSeriesVariantOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			seriesId,
			payload
		}: {
			seriesId: string
			payload: CreateWeaponSeriesVariantPayload
		}) => seriesAdapter.createWeaponSeriesVariant(seriesId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.allWeaponSeries() })
		}
	}
}

export function updateWeaponSeriesVariantOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({
			seriesId,
			variantId,
			payload
		}: {
			seriesId: string
			variantId: string
			payload: UpdateWeaponSeriesVariantPayload
		}) => seriesAdapter.updateWeaponSeriesVariant(seriesId, variantId, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.allWeaponSeries() })
		}
	}
}

export function deleteWeaponSeriesVariantOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ seriesId, variantId }: { seriesId: string; variantId: string }) =>
			seriesAdapter.deleteWeaponSeriesVariant(seriesId, variantId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: entityKeys.allWeaponSeries() })
		}
	}
}

export function useCreateWeaponSeriesVariant() {
	const queryClient = useQueryClient()
	return createMutation(() => createWeaponSeriesVariantOptions(queryClient))
}

export function useUpdateWeaponSeriesVariant() {
	const queryClient = useQueryClient()
	return createMutation(() => updateWeaponSeriesVariantOptions(queryClient))
}

export function useDeleteWeaponSeriesVariant() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteWeaponSeriesVariantOptions(queryClient))
}
