import { describe, it, expect } from 'vitest'
import * as m from '$lib/paraglide/messages'
import type { CrewInvitation, CrewMembership, PhantomPlayer } from '$lib/types/api/crew'
import {
	countActiveMembers,
	isInvitationExpired,
	memberFilterFromUrl,
	memberFilterOptions,
	pendingClaimPhantoms,
	sortByRole,
	splitInvitations,
	splitMemberSections,
	urlForMemberFilter
} from '../memberList'

const now = new Date('2026-11-01T12:00:00Z')

function member(id: string, role: CrewMembership['role'], retired = false): CrewMembership {
	return { id, role, retired } as CrewMembership
}

function phantom(id: string, overrides: Partial<PhantomPlayer> = {}): PhantomPlayer {
	return { id, retired: false, claimConfirmed: false, ...overrides } as PhantomPlayer
}

function invitation(id: string, expiresAt: string): CrewInvitation {
	return { id, expiresAt } as CrewInvitation
}

describe('isInvitationExpired', () => {
	it('compares the expiry to now', () => {
		expect(isInvitationExpired('2026-11-01T11:59:59Z', now)).toBe(true)
		expect(isInvitationExpired('2026-11-01T12:00:00Z', now)).toBe(false)
		expect(isInvitationExpired('2026-11-02T00:00:00Z', now)).toBe(false)
	})
})

describe('splitInvitations', () => {
	it('separates live and expired invitations', () => {
		const live = invitation('a', '2026-11-05T00:00:00Z')
		const old = invitation('b', '2026-10-01T00:00:00Z')
		expect(splitInvitations([live, old], now)).toEqual({ active: [live], expired: [old] })
	})

	it('handles no data', () => {
		expect(splitInvitations(undefined, now)).toEqual({ active: [], expired: [] })
	})
})

describe('pendingClaimPhantoms', () => {
	it('keeps claimed phantoms that are not confirmed', () => {
		const claimed = phantom('a', { claimedBy: { id: 'u' } as PhantomPlayer['claimedBy'] })
		const confirmed = phantom('b', {
			claimedBy: { id: 'u' } as PhantomPlayer['claimedBy'],
			claimConfirmed: true
		})
		const unclaimed = phantom('c')
		expect(pendingClaimPhantoms([claimed, confirmed, unclaimed])).toEqual([claimed])
		expect(pendingClaimPhantoms(undefined)).toEqual([])
	})
})

describe('countActiveMembers', () => {
	it('counts members who have not retired', () => {
		expect(countActiveMembers([member('a', 'member'), member('b', 'member', true)])).toBe(1)
	})
})

describe('sortByRole', () => {
	it('orders captain, vice captains, then members, keeping order within a role', () => {
		const members = [
			member('m1', 'member'),
			member('v1', 'vice_captain'),
			member('c', 'captain'),
			member('m2', 'member'),
			member('v2', 'vice_captain')
		]
		expect(sortByRole(members).map((mem) => mem.id)).toEqual(['c', 'v1', 'v2', 'm1', 'm2'])
		expect(members[0]?.id).toBe('m1')
	})
})

describe('splitMemberSections', () => {
	it('splits by retired status and sorts active members by role', () => {
		const sections = splitMemberSections(
			[member('m', 'member'), member('r', 'captain', true), member('c', 'captain')],
			[phantom('p'), phantom('rp', { retired: true })]
		)
		expect(sections.activeMembers.map((mem) => mem.id)).toEqual(['c', 'm'])
		expect(sections.retiredMembers.map((mem) => mem.id)).toEqual(['r'])
		expect(sections.activePhantoms.map((p) => p.id)).toEqual(['p'])
		expect(sections.retiredPhantoms.map((p) => p.id)).toEqual(['rp'])
	})

	it('handles no data', () => {
		expect(splitMemberSections(undefined, undefined)).toEqual({
			activeMembers: [],
			retiredMembers: [],
			activePhantoms: [],
			retiredPhantoms: []
		})
	})
})

describe('memberFilterOptions', () => {
	it('shows Pending to officers only', () => {
		expect(memberFilterOptions(false).map((o) => o.value)).toEqual(['all', 'active', 'retired'])
		expect(memberFilterOptions(true).map((o) => o.value)).toEqual([
			'all',
			'active',
			'pending',
			'retired'
		])
		expect(memberFilterOptions(true)[2]?.label).toBe(m.crew_filter_pending())
	})
})

describe('member filter URLs', () => {
	const base = 'https://granblue.team/crew/members'

	it('reads the filter param, defaulting to all', () => {
		expect(memberFilterFromUrl(new URL(base))).toBe('all')
		expect(memberFilterFromUrl(new URL(`${base}?filter=`))).toBe('all')
		expect(memberFilterFromUrl(new URL(`${base}?filter=retired`))).toBe('retired')
	})

	it('sets the param, or drops it for all', () => {
		expect(urlForMemberFilter(new URL(base), 'pending').search).toBe('?filter=pending')
		expect(urlForMemberFilter(new URL(`${base}?filter=pending`), 'all').search).toBe('')
	})
})
