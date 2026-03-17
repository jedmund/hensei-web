/**
 * Tests for PlaylistAdapter
 *
 * Verifies playlist CRUD operations and party management
 * with proper URL construction and request/response handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { PlaylistAdapter } from '../playlist.adapter'
import type { Playlist } from '$lib/types/api/playlist'

describe('PlaylistAdapter', () => {
	let adapter: PlaylistAdapter
	let originalFetch: typeof global.fetch

	const mockPlaylist: Playlist = {
		id: 'playlist-1',
		title: 'Test Playlist',
		slug: 'test-playlist',
		description: 'A test playlist',
		visibility: 1,
		partyCount: 2,
		user: { id: 'user-1', username: 'testuser' },
		createdAt: '2024-01-01T00:00:00Z',
		updatedAt: '2024-01-01T00:00:00Z'
	}

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new PlaylistAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
	})

	describe('list', () => {
		it('sends GET to user playlists endpoint with page param', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					results: [mockPlaylist],
					meta: { count: 1, total_pages: 1, per_page: 15 }
				})
			})

			const result = await adapter.list('testuser', 2)

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/users/testuser/playlists'),
				expect.any(Object)
			)
			expect(result.results).toHaveLength(1)
			expect(result.page).toBe(2)
			expect(result.totalPages).toBe(1)
		})
	})

	describe('get', () => {
		it('returns a playlist with nested data', async () => {
			const playlistWithParties = { ...mockPlaylist, parties: [] }
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ playlist: playlistWithParties })
			})

			const result = await adapter.get('testuser', 'playlist-1')

			expect(global.fetch).toHaveBeenCalledWith(
				expect.stringContaining('/users/testuser/playlists/playlist-1'),
				expect.any(Object)
			)
			expect(result.id).toBe('playlist-1')
		})
	})

	describe('create', () => {
		it('sends POST with playlist params', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ playlist: mockPlaylist })
			})

			const result = await adapter.create({
				title: 'Test Playlist',
				description: 'A test playlist'
			})

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/playlists',
				expect.objectContaining({ method: 'POST' })
			)
			expect(result.title).toBe('Test Playlist')
		})
	})

	describe('update', () => {
		it('sends PATCH to playlist endpoint', async () => {
			const updated = { ...mockPlaylist, title: 'Updated' }
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ playlist: updated })
			})

			const result = await adapter.update({ id: 'playlist-1', title: 'Updated' })

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/playlists/playlist-1',
				expect.objectContaining({ method: 'PATCH' })
			)
			expect(result.title).toBe('Updated')
		})
	})

	describe('destroy', () => {
		it('sends DELETE to playlist endpoint', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({})
			})

			await adapter.destroy('playlist-1')

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/playlists/playlist-1',
				expect.objectContaining({ method: 'DELETE' })
			)
		})
	})

	describe('addParty', () => {
		it('sends POST to nested parties endpoint', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ playlist: mockPlaylist })
			})

			await adapter.addParty('playlist-1', 'party-1')

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/playlists/playlist-1/parties',
				expect.objectContaining({ method: 'POST' })
			)
		})
	})

	describe('removeParty', () => {
		it('sends DELETE to nested party endpoint', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({})
			})

			await adapter.removeParty('playlist-1', 'party-1')

			expect(global.fetch).toHaveBeenCalledWith(
				'https://api.example.com/playlists/playlist-1/parties/party-1',
				expect.objectContaining({ method: 'DELETE' })
			)
		})
	})

	describe('error handling', () => {
		it('throws on 404 response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404,
				json: async () => ({ error: { message: 'Not found' } })
			})

			await expect(adapter.get('testuser', 'nonexistent')).rejects.toThrow()
		})

		it('throws on 422 validation error', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 422,
				json: async () => ({ errors: { title: ["can't be blank"] } })
			})

			await expect(adapter.create({ title: '' })).rejects.toThrow()
		})
	})
})
