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
	staffPicks: (eventId: string) => [...eventKeys.all, 'staff-picks', eventId] as const
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
		})
}
