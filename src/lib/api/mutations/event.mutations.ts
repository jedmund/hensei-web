/**
 * Event Mutation Configurations (editors)
 *
 * Event CRUD, approve/hide, banner upload, the schedule sync trigger and
 * staff picks.
 *
 * @module api/mutations/event
 */

import { useQueryClient, createMutation, type QueryClient } from '@tanstack/svelte-query'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { featuredPartyAdapter } from '$lib/api/adapters/featuredParty.adapter'
import { eventKeys } from '$lib/api/queries/event.queries'
import { homeKeys } from '$lib/api/queries/home.queries'
import type { EventPayload, GameEvent } from '$lib/types/api/event'
import type { FeaturedPartyPayload } from '$lib/types/api/featuredParty'

function invalidateEvents(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: eventKeys.all })
	queryClient.invalidateQueries({ queryKey: homeKeys.all })
}

function storeEvent(queryClient: QueryClient, event: GameEvent | undefined) {
	if (event?.id) queryClient.setQueryData(eventKeys.detail(event.id), event)
	invalidateEvents(queryClient)
}

export function createEventOptions(queryClient: QueryClient) {
	return {
		mutationFn: (payload: EventPayload) => eventAdapter.createEvent(payload),
		onSuccess: (event: GameEvent) => storeEvent(queryClient, event)
	}
}

export function useCreateEvent() {
	const queryClient = useQueryClient()
	return createMutation(() => createEventOptions(queryClient))
}

export function updateEventOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, payload }: { id: string; payload: Partial<EventPayload> }) =>
			eventAdapter.updateEvent(id, payload),
		onSuccess: (event: GameEvent) => storeEvent(queryClient, event)
	}
}

export function useUpdateEvent() {
	const queryClient = useQueryClient()
	return createMutation(() => updateEventOptions(queryClient))
}

export function uploadEventImageOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, file }: { id: string; file: File }) =>
			eventAdapter.uploadImage(id, file, file.name),
		onSuccess: () => invalidateEvents(queryClient)
	}
}

export function useUploadEventImage() {
	const queryClient = useQueryClient()
	return createMutation(() => uploadEventImageOptions(queryClient))
}

export function runEventSyncOptions(queryClient: QueryClient) {
	return {
		mutationFn: () => eventAdapter.runSync(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
	}
}

export function useRunEventSync() {
	const queryClient = useQueryClient()
	return createMutation(() => runEventSyncOptions(queryClient))
}

// ============================================================================
// Staff picks
// ============================================================================

// Every pick list (per event and per team) and Home, which shows them
function invalidatePicks(queryClient: QueryClient) {
	queryClient.invalidateQueries({ queryKey: eventKeys.staffPicksAll() })
	queryClient.invalidateQueries({ queryKey: homeKeys.all })
}

export function createStaffPickOptions(queryClient: QueryClient) {
	return {
		mutationFn: (payload: FeaturedPartyPayload) =>
			featuredPartyAdapter.createFeaturedParty(payload),
		onSuccess: () => invalidatePicks(queryClient)
	}
}

export function useCreateStaffPick() {
	const queryClient = useQueryClient()
	return createMutation(() => createStaffPickOptions(queryClient))
}

interface UpdateStaffPickVars {
	id: string
	eventId: string | null
	payload: Partial<FeaturedPartyPayload>
}

export function updateStaffPickOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id, payload }: UpdateStaffPickVars) =>
			featuredPartyAdapter.updateFeaturedParty(id, payload),
		onSuccess: () => invalidatePicks(queryClient)
	}
}

export function useUpdateStaffPick() {
	const queryClient = useQueryClient()
	return createMutation(() => updateStaffPickOptions(queryClient))
}

export function deleteStaffPickOptions(queryClient: QueryClient) {
	return {
		mutationFn: ({ id }: { id: string; eventId: string | null }) =>
			featuredPartyAdapter.deleteFeaturedParty(id),
		onSuccess: () => invalidatePicks(queryClient)
	}
}

export function useDeleteStaffPick() {
	const queryClient = useQueryClient()
	return createMutation(() => deleteStaffPickOptions(queryClient))
}
