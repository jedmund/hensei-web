import { describe, it, expect } from 'vitest'
import { bylineText, partyByline } from '../partyByline'

const alice = { username: 'alice' }
const bob = { username: 'bob' }
const carol = { username: 'carol' }

describe('partyByline', () => {
	it('remixed using a collection: the source creator behind the creator', () => {
		const byline = partyByline({
			user: alice,
			sourceParty: { shortcode: 'abc123', user: bob },
			collectionSourceUser: carol
		})
		expect(byline).toMatchObject({ kind: 'pair', back: bob, front: alice })
		expect(byline?.segments).toEqual([
			{ text: 'alice', href: '/alice' },
			{ text: ' remixed ' },
			{ text: "bob's team", href: '/teams/abc123' },
			{ text: ' using ' },
			{ text: 'carol', href: '/carol' },
			{ text: "'s collection" }
		])
	})

	it("remixed: the creator links to their profile and bob's team to the original", () => {
		const byline = partyByline({ user: alice, sourceParty: { shortcode: 'abc123', user: bob } })
		expect(byline).toMatchObject({ kind: 'pair', back: bob, front: alice })
		expect(byline?.segments).toEqual([
			{ text: 'alice', href: '/alice' },
			{ text: ' remixed ' },
			{ text: "bob's team", href: '/teams/abc123' }
		])
	})

	it("doesn't link the team without the original's shortcode", () => {
		const byline = partyByline({ user: alice, sourceParty: { user: bob } })
		expect(bylineText(byline!.segments)).toBe("alice remixed bob's team")
		expect(byline?.segments.at(-1)).toEqual({ text: "bob's team" })
	})

	it('remixed without an account', () => {
		const byline = partyByline({ sourceParty: { shortcode: 'abc123', user: bob } })
		expect(byline).toMatchObject({ kind: 'plain' })
		expect(byline?.segments).toContainEqual({ text: "bob's team", href: '/teams/abc123' })
	})

	it('remixed from a team without an account links the creator and the original', () => {
		const byline = partyByline({ user: alice, sourceParty: { shortcode: 'abc123', user: null } })
		expect(byline).toMatchObject({ kind: 'link', user: alice })
		expect(byline?.segments).toEqual([
			{ text: 'alice', href: '/alice' },
			{ text: ' remixed ' },
			{ text: 'an anonymous team', href: '/teams/abc123' }
		])
	})

	it('remixed between teams without accounts links the original', () => {
		expect(partyByline({ sourceParty: { shortcode: 'abc123' } })).toEqual({
			kind: 'plain',
			segments: [{ text: 'Remix', href: '/teams/abc123' }]
		})
	})

	it('using their own collection', () => {
		expect(partyByline({ user: alice, collectionSourceUser: alice })).toMatchObject({
			kind: 'link',
			user: alice
		})
	})

	it("using someone else's collection: its owner in front", () => {
		expect(partyByline({ user: alice, collectionSourceUser: bob })).toMatchObject({
			kind: 'pair',
			back: alice,
			front: bob
		})
	})

	it('by the creator alone, named', () => {
		expect(partyByline({ user: alice })).toEqual({
			kind: 'link',
			user: alice,
			segments: [{ text: 'alice', href: '/alice' }]
		})
	})

	it('is empty without a creator or source', () => {
		expect(partyByline({})).toBeNull()
	})

	it('ignores sources and collections whose owner has no name', () => {
		expect(
			partyByline({ user: alice, sourceParty: { user: {} }, collectionSourceUser: {} })
		).toMatchObject({ kind: 'link', user: alice })
	})
})
