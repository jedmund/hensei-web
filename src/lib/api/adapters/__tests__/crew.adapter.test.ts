import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CrewAdapter } from '../crew.adapter'

describe('CrewAdapter', () => {
	let adapter: CrewAdapter
	let originalFetch: typeof global.fetch

	beforeEach(() => {
		originalFetch = global.fetch
		adapter = new CrewAdapter({ baseURL: 'https://api.example.com' })
	})

	afterEach(() => {
		global.fetch = originalFetch
		vi.clearAllTimers()
	})

	describe('crew operations', () => {
		it('should unwrap crew from getMyCrew response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ crew: { id: 'crew-1', name: 'Test Crew' } })
			})

			const result = await adapter.getMyCrew()

			expect(result).toEqual({ id: 'crew-1', name: 'Test Crew' })
		})

		it('should send page and per_page params in getSharedParties', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({
					parties: [{ id: 'p1' }],
					meta: { page: 2, total_pages: 3, count: 50, per_page: 20 }
				})
			})

			await adapter.getSharedParties(2, 20)

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('page=2')
			expect(url).toContain('per_page=20')
		})

		it('should clear dual cache on leave', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({})
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.leave()

			expect(clearSpy).toHaveBeenCalledWith('/crew')
			expect(clearSpy).toHaveBeenCalledWith('/crew/members')
		})

		it('should send user_id in transferCaptain body', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ crew: { id: 'crew-1' } })
			})

			await adapter.transferCaptain('crew-1', 'user-2')

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			expect(body.user_id).toBe('user-2')
		})
	})

	describe('members', () => {
		it('should not send filter param for default active members', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ members: [], phantom_players: [] })
			})

			await adapter.getMembers()

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).not.toContain('filter')
		})

		it('should send filter param for retired members', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ members: [], phantom_players: [] })
			})

			await adapter.getMembers('retired')

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('filter=retired')
		})

		it('should build full query string for getRoster', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ members: [] })
			})

			await adapter.getRoster({
				characterIds: ['c1', 'c2'],
				weaponIds: ['w1'],
				summonIds: ['s1']
			})

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('character_ids')
			expect(url).toContain('c1')
			expect(url).toContain('c2')
			expect(url).toContain('weapon_ids')
			expect(url).toContain('w1')
			expect(url).toContain('summon_ids')
			expect(url).toContain('s1')
		})

		it('should send no query string for empty getRoster', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ members: [] })
			})

			await adapter.getRoster({})

			const url = (global.fetch as any).mock.calls[0][0]
			expect(url).toContain('/crew/roster')
			expect(url).not.toContain('?')
		})
	})

	describe('invitations', () => {
		it('should send user_id and unwrap invitation from sendInvitation', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ invitation: { id: 'inv-1', status: 'pending' } })
			})

			const result = await adapter.sendInvitation('crew-1', 'user-2')

			const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
			expect(body.user_id).toBe('user-2')
			expect(result).toEqual({ id: 'inv-1', status: 'pending' })
		})

		it('should clear dual cache on acceptInvitation', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ membership: { id: 'mem-1' } })
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.acceptInvitation('inv-1')

			expect(clearSpy).toHaveBeenCalledWith('/crew')
			expect(clearSpy).toHaveBeenCalledWith('/invitations/pending')
		})
	})

	describe('phantom players', () => {
		it('should unwrap phantomPlayer from createPhantom response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ phantom_player: { id: 'p1', name: 'Ghost' } })
			})

			const result = await adapter.createPhantom('crew-1', { name: 'Ghost' } as any)

			expect(result).toEqual({ id: 'p1', name: 'Ghost' })
		})

		it('should unwrap phantomPlayers from bulkCreatePhantoms response', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ phantom_players: [{ id: 'p1' }, { id: 'p2' }] })
			})

			const result = await adapter.bulkCreatePhantoms('crew-1', [{ name: 'Ghost1' }, { name: 'Ghost2' }] as any)

			expect(result).toEqual([{ id: 'p1' }, { id: 'p2' }])
		})

		it('should clear dual cache on declinePhantomClaim', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ phantom_player: { id: 'p1' } })
			})
			const clearSpy = vi.spyOn(adapter as any, 'clearCache')

			await adapter.declinePhantomClaim('crew-1', 'p1')

			expect(clearSpy).toHaveBeenCalledWith('/crew/members')
			expect(clearSpy).toHaveBeenCalledWith('/pending_phantom_claims')
		})

		it('should unwrap phantomClaims from getPendingPhantomClaims', async () => {
			const mockClaims = [{ id: 'p1', name: 'Ghost' }]
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				json: async () => ({ phantom_claims: mockClaims })
			})

			const result = await adapter.getPendingPhantomClaims()

			expect(result).toEqual(mockClaims)
		})
	})
})
