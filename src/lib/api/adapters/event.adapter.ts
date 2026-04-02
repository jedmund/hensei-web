import { BaseAdapter } from './base.adapter'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { GameEvent, CreateEventInput, UpdateEventInput } from '$lib/types/api/event'
import type { RequestOptions } from './types'

export class EventAdapter extends BaseAdapter {
	constructor(options = DEFAULT_ADAPTER_CONFIG) {
		super(options)
	}

	async getEvents(filters?: { byType?: string }, options?: RequestOptions): Promise<GameEvent[]> {
		const params: Record<string, string> = {}
		if (filters?.byType) params.by_type = filters.byType

		return this.request<GameEvent[]>('/events', { ...options, params })
	}

	async getEvent(id: string, options?: RequestOptions): Promise<GameEvent> {
		return this.request<GameEvent>(`/events/${id}`, options)
	}

	async createEvent(input: CreateEventInput, options?: RequestOptions): Promise<GameEvent> {
		return this.request<GameEvent>('/events', {
			...options,
			method: 'POST',
			body: { event: input }
		})
	}

	async updateEvent(
		id: string,
		input: UpdateEventInput,
		options?: RequestOptions
	): Promise<GameEvent> {
		return this.request<GameEvent>(`/events/${id}`, {
			...options,
			method: 'PATCH',
			body: { event: input }
		})
	}

	async deleteEvent(id: string, options?: RequestOptions): Promise<void> {
		await this.request<void>(`/events/${id}`, {
			...options,
			method: 'DELETE'
		})
	}

	async uploadBanner(
		id: string,
		imageBase64: string,
		options?: RequestOptions
	): Promise<{ success: boolean; url: string }> {
		return this.request<{ success: boolean; url: string }>(`/events/${id}/upload_banner`, {
			...options,
			method: 'POST',
			body: { image: imageBase64 }
		})
	}
}

export const eventAdapter = new EventAdapter(DEFAULT_ADAPTER_CONFIG)
