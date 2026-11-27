/**
 * Notification Adapter
 *
 * The current user's notifications: the feed, the jewel's unread count, and
 * marking them seen or read (GBF-82).
 *
 * @module adapters/notification
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { NotificationPage } from '$lib/types/api/notification'

const BASE = '/notifications'

export class NotificationAdapter extends BaseAdapter {
	async list(
		params: { page?: number; perPage?: number } = {},
		options?: RequestOptions
	): Promise<NotificationPage> {
		return this.request<NotificationPage>(BASE, {
			...options,
			query: { page: params.page ?? 1, ...(params.perPage ? { per_page: params.perPage } : {}) }
		})
	}

	async unreadCount(options?: RequestOptions): Promise<number> {
		const response = await this.request<{ unreadCount: number }>(`${BASE}/unread_count`, options)
		return response.unreadCount
	}

	/** The jewel was opened: clears passive rows from the count. Returns the new count. */
	async markSeen(options?: RequestOptions): Promise<number> {
		const response = await this.request<{ unreadCount: number }>(`${BASE}/seen`, {
			...options,
			method: 'POST'
		})
		return response.unreadCount
	}

	async markRead(id: string, options?: RequestOptions): Promise<void> {
		return this.request<void>(`${BASE}/${id}/read`, { ...options, method: 'POST' })
	}

	async markAllRead(options?: RequestOptions): Promise<void> {
		return this.request<void>(`${BASE}/read_all`, { ...options, method: 'POST' })
	}
}

export const notificationAdapter = new NotificationAdapter(DEFAULT_ADAPTER_CONFIG)
