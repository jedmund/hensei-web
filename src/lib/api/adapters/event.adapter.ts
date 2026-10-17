/**
 * Event Adapter
 *
 * Game events (story events, Unite and Fight, collabs...). Public callers see
 * approved events only; editors manage drafts synced from the schedule
 * sources, approve or hide them, and trigger the sync.
 *
 * @module adapters/event
 */

import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { RequestOptions } from './types'
import type { EventPayload, GameEvent, ListEventsParams } from '$lib/types/api/event'

const BASE = '/events'

export class EventAdapter extends BaseAdapter {
	async listEvents(params: ListEventsParams = {}, options?: RequestOptions): Promise<GameEvent[]> {
		const query: Record<string, string> = {}
		if (params.scope) query.scope = params.scope
		if (params.kind) query.kind = params.kind
		if (params.status) query.status = params.status

		const response = await this.request<{ events: GameEvent[] }>(BASE, { ...options, query })
		return response.events
	}

	async getEvent(id: string, options?: RequestOptions): Promise<GameEvent> {
		return this.request<GameEvent>(`${BASE}/${id}`, options)
	}

	async createEvent(payload: EventPayload, options?: RequestOptions): Promise<GameEvent> {
		return this.request<GameEvent>(BASE, {
			...options,
			method: 'POST',
			body: { event: payload }
		})
	}

	async updateEvent(
		id: string,
		payload: Partial<EventPayload>,
		options?: RequestOptions
	): Promise<GameEvent> {
		return this.request<GameEvent>(`${BASE}/${id}`, {
			...options,
			method: 'PUT',
			body: { event: payload }
		})
	}

	async approveEvent(id: string, options?: RequestOptions): Promise<GameEvent> {
		return this.request<GameEvent>(`${BASE}/${id}/approve`, { ...options, method: 'POST' })
	}

	async hideEvent(id: string, options?: RequestOptions): Promise<GameEvent> {
		return this.request<GameEvent>(`${BASE}/${id}/hide`, { ...options, method: 'POST' })
	}

	/** Uploads banner art as the multipart field `image` */
	async uploadImage(id: string, file: Blob, filename?: string): Promise<GameEvent> {
		const form = new FormData()
		if (filename) form.append('image', file, filename)
		else form.append('image', file)
		return this.request<GameEvent>(`${BASE}/${id}/upload_image`, {
			method: 'POST',
			body: form
		})
	}

	/** Queues the schedule sync job */
	async runSync(options?: RequestOptions): Promise<{ queued: boolean }> {
		return this.request<{ queued: boolean }>(`${BASE}/sync`, { ...options, method: 'POST' })
	}
}

export const eventAdapter = new EventAdapter(DEFAULT_ADAPTER_CONFIG)
