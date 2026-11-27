/**
 * Notification Query Options Factory (GBF-82)
 *
 * @module api/queries/notification
 */

import { infiniteQueryOptions, queryOptions } from '@tanstack/svelte-query'
import { notificationAdapter } from '$lib/api/adapters/notification.adapter'

/** How many rows the jewel's popover shows */
export const POPOVER_LIMIT = 8

export const notificationKeys = {
	all: ['notifications'] as const,
	unreadCount: () => [...notificationKeys.all, 'unread_count'] as const,
	recent: () => [...notificationKeys.all, 'recent'] as const,
	feed: () => [...notificationKeys.all, 'feed'] as const
}

export const notificationQueries = {
	/** The jewel's badge. Polled; there's no realtime channel. */
	unreadCount: () =>
		queryOptions({
			queryKey: notificationKeys.unreadCount(),
			queryFn: () => notificationAdapter.unreadCount(),
			staleTime: 1000 * 30,
			refetchInterval: 1000 * 60 * 2,
			refetchOnWindowFocus: true
		}),

	/** The latest rows, for the popover */
	recent: () =>
		queryOptions({
			queryKey: notificationKeys.recent(),
			queryFn: () => notificationAdapter.list({ perPage: POPOVER_LIMIT }),
			staleTime: 1000 * 30
		}),

	/** Every row, a page at a time, for the "View all" pane */
	feed: () =>
		infiniteQueryOptions({
			queryKey: notificationKeys.feed(),
			queryFn: ({ pageParam }) => notificationAdapter.list({ page: pageParam }),
			initialPageParam: 1,
			getNextPageParam: (last, _all, lastPageParam) =>
				lastPageParam < last.meta.totalPages ? lastPageParam + 1 : undefined,
			staleTime: 1000 * 30
		})
}
