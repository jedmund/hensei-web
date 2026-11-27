/**
 * Notification mutations (GBF-82)
 *
 * @module api/mutations/notification
 */

import { createMutation, useQueryClient } from '@tanstack/svelte-query'
import { notificationAdapter } from '$lib/api/adapters/notification.adapter'
import { notificationKeys } from '$lib/api/queries/notification.queries'

/** Opening the jewel: the server returns the new count, so set it directly */
export function useMarkNotificationsSeen() {
	const queryClient = useQueryClient()
	return createMutation(() => ({
		mutationFn: () => notificationAdapter.markSeen(),
		onSuccess: (count: number) => {
			queryClient.setQueryData(notificationKeys.unreadCount(), count)
		}
	}))
}

export function useMarkNotificationRead() {
	const queryClient = useQueryClient()
	return createMutation(() => ({
		mutationFn: (id: string) => notificationAdapter.markRead(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
	}))
}

export function useMarkAllNotificationsRead() {
	const queryClient = useQueryClient()
	return createMutation(() => ({
		mutationFn: () => notificationAdapter.markAllRead(),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
	}))
}
