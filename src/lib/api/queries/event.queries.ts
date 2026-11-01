/**
 * Event Query Options Factory
 *
 * @module api/queries/event
 */

import { queryOptions } from '@tanstack/svelte-query'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { featuredPartyAdapter } from '$lib/api/adapters/featuredParty.adapter'
import type { ListEventsParams } from '$lib/types/api/event'

export const eventKeys = {
	all: ['events'] as const,
	lists: () => [...eventKeys.all, 'list'] as const,
	list: (params: ListEventsParams = {}) => [...eventKeys.lists(), params] as const,
	detail: (id: string) => [...eventKeys.all, 'detail', id] as const,
	staffPicksAll: () => [...eventKeys.all, 'staff-picks'] as const,
	staffPicks: (eventId: string) => [...eventKeys.staffPicksAll(), eventId] as const,
	partyPicks: (partyId: string) => [...eventKeys.staffPicksAll(), 'party', partyId] as const
}

export const eventQueries = {
	list: (params: ListEventsParams = {}) =>
		queryOptions({
			queryKey: eventKeys.list(params),
			queryFn: () => eventAdapter.listEvents(params),
			staleTime: 1000 * 60 * 5
		}),

	byId: (id: string | undefined) =>
		queryOptions({
			queryKey: eventKeys.detail(id ?? ''),
			queryFn: () => eventAdapter.getEvent(id as string),
			enabled: !!id,
			staleTime: 1000 * 60 * 5
		}),

	staffPicks: (eventId: string | undefined) =>
		queryOptions({
			queryKey: eventKeys.staffPicks(eventId ?? ''),
			queryFn: () => featuredPartyAdapter.listFeaturedParties({ eventId: eventId as string }),
			enabled: !!eventId,
			staleTime: 1000 * 60
		}),

	/** Where one team is featured */
	partyPicks: (partyId: string | undefined, enabled = true) =>
		queryOptions({
			queryKey: eventKeys.partyPicks(partyId ?? ''),
			queryFn: () => featuredPartyAdapter.listFeaturedParties({ partyId: partyId as string }),
			enabled: enabled && !!partyId,
			staleTime: 1000 * 60
		})
}
