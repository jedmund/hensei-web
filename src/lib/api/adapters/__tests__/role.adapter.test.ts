import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RoleAdapter } from '../role.adapter'
import { API, EXPECTED, REQUEST } from './fixtures/role.fixtures'
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
		global.fetch = mockApiResponse(API.roleList)

		await adapter.listRoles()

		const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles')
	})

	it('getRole hits /:id and camelCases the response', async () => {
		global.fetch = mockApiResponse(API.role)

		const result = await adapter.getRole('role-uuid-1')

		const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/role-uuid-1')
		expect(result).toMatchObject(EXPECTED.role)
	})

	it('createRole POSTs the grid_character_role envelope', async () => {
		global.fetch = mockApiResponse(API.createdRole)

		await adapter.createRole({ nameEn: 'Healer', nameJp: 'ヒーラー' }, { Authorization: 'x' })

		const [, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual(REQUEST.createPayload)
		expect(init.headers).toMatchObject({ Authorization: 'x' })
	})

	it('updateRole PUTs the envelope', async () => {
		global.fetch = mockApiResponse(API.createdRole)

		await adapter.updateRole('role-uuid-new', { nameEn: 'Buffer' })

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/role-uuid-new')
		expect(init.method).toBe('PUT')
		expect(JSON.parse(init.body)).toEqual(REQUEST.updatePayload)
	})

	it('deleteRole DELETEs /:id', async () => {
		global.fetch = mockApiResponse({})

		await adapter.deleteRole('r3')

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/r3')
		expect(init.method).toBe('DELETE')
	})

	it('reorderRoles POSTs to /reorder with the roles array', async () => {
		global.fetch = mockApiResponse(API.roleList)

		await adapter.reorderRoles([
			{ id: 'a', sortOrder: 0 },
			{ id: 'b', sortOrder: 1 }
		])

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/reorder')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual(REQUEST.reorderPayload)
	})

	it('uploadIcon POSTs to /:id/upload_icon with image + filename', async () => {
		global.fetch = mockApiResponse(API.uploadResult)

		await adapter.uploadIcon('role-uuid-1', 'BASE64DATA', 'icon.png')

		const [url, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0]!
		expect(url).toBe('https://api.example.com/grid_character_roles/role-uuid-1/upload_icon')
		expect(init.method).toBe('POST')
		expect(JSON.parse(init.body)).toEqual(REQUEST.uploadPayload)
	})
})
