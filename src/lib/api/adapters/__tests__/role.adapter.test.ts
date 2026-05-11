import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RoleAdapter } from '../role.adapter'
import { mockApiResponse } from './fixtures/helpers'

describe('RoleAdapter', () => {
	let adapter: RoleAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new RoleAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	it('listRoles hits /grid_character_roles', async () => {
		global.fetch = mockApiResponse([])

		await adapter.listRoles()

		const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles')
	})

	it('getRole hits /grid_character_roles/:id', async () => {
		global.fetch = mockApiResponse({ id: 'r1', name_en: 'Attacker' })

		const result = await adapter.getRole('r1')

		const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/r1')
		expect(result).toMatchObject({ id: 'r1', nameEn: 'Attacker' })
	})

	it('createRole POSTs with grid_character_role envelope', async () => {
		global.fetch = mockApiResponse({ id: 'r2', nameEn: 'Healer' })

		await adapter.createRole({ nameEn: 'Healer', nameJp: 'ヒーラー' }, { Authorization: 'x' })

		const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual({
			grid_character_role: { name_en: 'Healer', name_jp: 'ヒーラー' }
		})
		expect(init.headers).toMatchObject({ Authorization: 'x' })
	})

	it('updateRole PUTs with envelope', async () => {
		global.fetch = mockApiResponse({ id: 'r2', nameEn: 'Buffer' })

		await adapter.updateRole('r2', { nameEn: 'Buffer' })

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/r2')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual({ grid_character_role: { name_en: 'Buffer' } })
	})

	it('deleteRole DELETEs /:id', async () => {
		global.fetch = mockApiResponse({})

		await adapter.deleteRole('r3')

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/r3')
		expect(init.method).toBe('DELETE')
	})

	it('reorderRoles POSTs to /reorder with the roles array', async () => {
		global.fetch = mockApiResponse([])

		await adapter.reorderRoles([
			{ id: 'a', sortOrder: 0 },
			{ id: 'b', sortOrder: 1 }
		])

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/reorder')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual({
			roles: [
				{ id: 'a', sort_order: 0 },
				{ id: 'b', sort_order: 1 }
			]
		})
	})

	it('uploadIcon POSTs to /:id/upload_icon with image + filename', async () => {
		global.fetch = mockApiResponse({ id: 'r1', iconKey: 'roles/r1.png' })

		await adapter.uploadIcon('r1', 'BASE64DATA', 'icon.png')

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/r1/upload_icon')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual({ image: 'BASE64DATA', filename: 'icon.png' })
	})
})
