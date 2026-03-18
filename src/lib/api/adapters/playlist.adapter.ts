/**
 * Playlist Adapter
 *
 * Handles all playlist-related API operations including CRUD
 * and managing party membership within playlists.
 *
 * @module adapters/playlist
 */

import { BaseAdapter } from './base.adapter'
import type { AdapterOptions, PaginatedResponse, RequestOptions } from './types'
import { DEFAULT_ADAPTER_CONFIG } from './config'
import type { Playlist } from '$lib/types/api/playlist'

export interface CreatePlaylistParams {
	title: string
	description?: string
	videoUrl?: string
	visibility?: number
}

export interface UpdatePlaylistParams {
	id: string
	title?: string
	description?: string | null
	videoUrl?: string | null
	visibility?: number
}

export class PlaylistAdapter extends BaseAdapter {
	constructor(options?: AdapterOptions) {
		super(options)
	}

	/**
	 * Lists playlists for a user (respects visibility on server)
	 */
	async list(username: string, page?: number): Promise<PaginatedResponse<Playlist>> {
		const response = await this.request<{
			results: Playlist[]
			meta?: { count?: number; totalPages?: number; perPage?: number }
		}>(`/users/${username}/playlists`, {
			query: { page }
		})

		return {
			results: response.results,
			page: page || 1,
			total: response.meta?.count || 0,
			totalPages: response.meta?.totalPages || 1,
			perPage: response.meta?.perPage || 15
		}
	}

	/**
	 * Gets a single playlist with its parties
	 */
	async get(username: string, id: string, options?: RequestOptions): Promise<Playlist> {
		const response = await this.request<{ playlist: Playlist }>(
			`/users/${username}/playlists/${id}`,
			{ ...options }
		)
		return response.playlist
	}

	/**
	 * Creates a new playlist for the authenticated user
	 */
	async create(params: CreatePlaylistParams): Promise<Playlist> {
		const response = await this.request<{ playlist: Playlist }>('/playlists', {
			method: 'POST',
			body: { playlist: params }
		})
		return response.playlist
	}

	/**
	 * Updates a playlist
	 */
	async update(params: UpdatePlaylistParams): Promise<Playlist> {
		const { id, ...updateParams } = params
		const response = await this.request<{ playlist: Playlist }>(`/playlists/${id}`, {
			method: 'PATCH',
			body: { playlist: updateParams }
		})
		return response.playlist
	}

	/**
	 * Deletes a playlist
	 */
	async destroy(id: string): Promise<void> {
		return this.request<void>(`/playlists/${id}`, {
			method: 'DELETE'
		})
	}

	/**
	 * Adds a party to a playlist
	 */
	async addParty(playlistId: string, partyId: string): Promise<Playlist> {
		const response = await this.request<{ playlist: Playlist }>(
			`/playlists/${playlistId}/parties`,
			{
				method: 'POST',
				body: { partyId }
			}
		)
		return response.playlist
	}

	/**
	 * Removes a party from a playlist
	 */
	async removeParty(playlistId: string, partyId: string): Promise<void> {
		return this.request<void>(`/playlists/${playlistId}/parties/${partyId}`, {
			method: 'DELETE'
		})
	}
}

export const playlistAdapter = new PlaylistAdapter(DEFAULT_ADAPTER_CONFIG)
