import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	createCrewOptions,
	updateCrewOptions,
	leaveCrewOptions,
	transferCaptainOptions,
	updateMembershipOptions,
	removeMemberOptions,
	sendInvitationOptions,
	acceptInvitationOptions,
	rejectInvitationOptions,
	createPhantomOptions,
	bulkCreatePhantomsOptions,
	updatePhantomOptions,
	deletePhantomOptions,
	assignPhantomOptions,
	confirmPhantomClaimOptions,
	declinePhantomClaimOptions
} from '../crew.mutations'
import { createTestQueryClient } from './helpers'
import { crewKeys } from '$lib/api/queries/crew.queries'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/crew.adapter', () => ({
	crewAdapter: {
		create: vi.fn(),
		update: vi.fn(),
		leave: vi.fn(),
		transferCaptain: vi.fn(),
		updateMembership: vi.fn(),
		removeMember: vi.fn(),
		sendInvitation: vi.fn(),
		acceptInvitation: vi.fn(),
		rejectInvitation: vi.fn(),
		createPhantom: vi.fn(),
		bulkCreatePhantoms: vi.fn(),
		updatePhantom: vi.fn(),
		deletePhantom: vi.fn(),
		assignPhantom: vi.fn(),
		confirmPhantomClaim: vi.fn(),
		declinePhantomClaim: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
})

// ============================================================================
// Crew CRUD
// ============================================================================

describe('createCrewOptions', () => {
	it('sets crew in cache on success', () => {
		const opts = createCrewOptions(queryClient)
		const crew = { id: 'crew-1', name: 'Test Crew' }

		opts.onSuccess(crew)

		expect(queryClient.getQueryData(crewKeys.myCrew())).toEqual(crew)
	})

	it('invalidates pending invitations on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createCrewOptions(queryClient)

		opts.onSuccess({ id: 'crew-1' })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.invitations.pending())
	})
})

describe('updateCrewOptions', () => {
	it('sets updated crew in cache on success', () => {
		const opts = updateCrewOptions(queryClient)
		const crew = { id: 'crew-1', name: 'Updated Crew' }

		opts.onSuccess(crew)

		expect(queryClient.getQueryData(crewKeys.myCrew())).toEqual(crew)
	})
})

describe('leaveCrewOptions', () => {
	it('removes crew and members from cache on success', () => {
		queryClient.setQueryData(crewKeys.myCrew(), { id: 'crew-1' })
		queryClient.setQueryData(crewKeys.membersAll(), [{ id: 'm-1' }])
		const opts = leaveCrewOptions(queryClient)

		opts.onSuccess()

		expect(queryClient.getQueryData(crewKeys.myCrew())).toBeUndefined()
		expect(queryClient.getQueryData(crewKeys.membersAll())).toBeUndefined()
	})
})

describe('transferCaptainOptions', () => {
	it('invalidates myCrew and membersAll on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = transferCaptainOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.myCrew())
		expect(keys).toContainEqual(crewKeys.membersAll())
	})
})

// ============================================================================
// Membership
// ============================================================================

describe('updateMembershipOptions', () => {
	it('invalidates membersAll on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateMembershipOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
	})
})

describe('removeMemberOptions', () => {
	it('invalidates membersAll and myCrew on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removeMemberOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
		expect(keys).toContainEqual(crewKeys.myCrew())
	})
})

// ============================================================================
// Invitations
// ============================================================================

describe('sendInvitationOptions', () => {
	it('invalidates crew-specific invitations on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = sendInvitationOptions(queryClient)

		opts.onSuccess(undefined, { crewId: 'crew-1', userId: 'user-1' })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.crewInvitations('crew-1'))
	})
})

describe('acceptInvitationOptions', () => {
	it('invalidates myCrew and pending invitations on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = acceptInvitationOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.myCrew())
		expect(keys).toContainEqual(crewKeys.invitations.pending())
	})
})

describe('rejectInvitationOptions', () => {
	it('invalidates pending invitations on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = rejectInvitationOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.invitations.pending())
	})
})

// ============================================================================
// Phantom Players
// ============================================================================

describe('createPhantomOptions', () => {
	it('invalidates membersAll on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createPhantomOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
	})
})

describe('bulkCreatePhantomsOptions', () => {
	it('invalidates membersAll on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = bulkCreatePhantomsOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
	})
})

describe('updatePhantomOptions', () => {
	it('invalidates membersAll on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updatePhantomOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
	})
})

describe('deletePhantomOptions', () => {
	it('invalidates membersAll on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deletePhantomOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
	})
})

describe('assignPhantomOptions', () => {
	it('invalidates membersAll on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = assignPhantomOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
	})
})

describe('confirmPhantomClaimOptions', () => {
	it('invalidates membersAll and pending phantom claims on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = confirmPhantomClaimOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
		expect(keys).toContainEqual(crewKeys.phantomClaims.pending())
	})
})

describe('declinePhantomClaimOptions', () => {
	it('invalidates membersAll and pending phantom claims on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = declinePhantomClaimOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(crewKeys.membersAll())
		expect(keys).toContainEqual(crewKeys.phantomClaims.pending())
	})
})
