import * as m from '$lib/paraglide/messages'
import type {
	CrewInvitation,
	CrewMembership,
	MemberFilter,
	PhantomPlayer
} from '$lib/types/api/crew'

/** A crew can't scout once it has this many active members (phantoms don't count) */
export const CREW_ROSTER_CAP = 30

/** A member action that needs confirming first */
export type MemberAction = 'remove' | 'promote' | 'demote'

export function isInvitationExpired(expiresAt: string, now = new Date()): boolean {
	return new Date(expiresAt) < now
}

/** Invitations still waiting on an answer, and those that ran out */
export function splitInvitations(
	invitations: CrewInvitation[] | undefined,
	now = new Date()
): { active: CrewInvitation[]; expired: CrewInvitation[] } {
	const all = invitations ?? []
	return {
		active: all.filter((inv) => !isInvitationExpired(inv.expiresAt, now)),
		expired: all.filter((inv) => isInvitationExpired(inv.expiresAt, now))
	}
}

/** Phantoms a member has claimed that an officer hasn't confirmed yet */
export function pendingClaimPhantoms(phantoms: PhantomPlayer[] | undefined): PhantomPlayer[] {
	return phantoms?.filter((p) => p.claimedBy && !p.claimConfirmed) ?? []
}

/** Members who haven't retired */
export function countActiveMembers(members: CrewMembership[]): number {
	return members.filter((mem) => !mem.retired).length
}

const ROLE_ORDER: Record<string, number> = { captain: 0, vice_captain: 1, member: 2 }

/** Captain, then vice captains, then members; order within a role is kept */
export function sortByRole(members: CrewMembership[]): CrewMembership[] {
	return members.toSorted((a, b) => (ROLE_ORDER[a.role] ?? 99) - (ROLE_ORDER[b.role] ?? 99))
}

export interface MemberSections {
	activeMembers: CrewMembership[]
	retiredMembers: CrewMembership[]
	activePhantoms: PhantomPlayer[]
	retiredPhantoms: PhantomPlayer[]
}

/**
 * Members and phantoms split by retired status, active members sorted by role
 * so the list reads top-down by rank.
 */
export function splitMemberSections(
	members: CrewMembership[] | undefined,
	phantoms: PhantomPlayer[] | undefined
): MemberSections {
	return {
		activeMembers: sortByRole((members ?? []).filter((mem) => !mem.retired)),
		retiredMembers: (members ?? []).filter((mem) => mem.retired),
		activePhantoms: (phantoms ?? []).filter((p) => !p.retired),
		retiredPhantoms: (phantoms ?? []).filter((p) => p.retired)
	}
}

/** The filters on the members page; Pending is for officers only */
export function memberFilterOptions(isOfficer: boolean): { value: MemberFilter; label: string }[] {
	const options: { value: MemberFilter; label: string }[] = [
		{ value: 'all', label: m.crew_filter_all() },
		{ value: 'active', label: m.crew_filter_active() }
	]
	if (isOfficer) {
		options.push({ value: 'pending', label: m.crew_filter_pending() })
	}
	options.push({ value: 'retired', label: m.crew_filter_retired() })
	return options
}

/** The filter in the page URL; no param means all */
export function memberFilterFromUrl(url: URL): MemberFilter {
	return (url.searchParams.get('filter') as MemberFilter) || 'all'
}

/** A copy of `url` showing `filter` */
export function urlForMemberFilter(url: URL, filter: MemberFilter): URL {
	const next = new URL(url)
	if (filter === 'all') {
		next.searchParams.delete('filter')
	} else {
		next.searchParams.set('filter', filter)
	}
	return next
}
