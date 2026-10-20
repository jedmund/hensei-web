import { describe, it, expect } from 'vitest'
import { partyByline } from '../partyByline'

const alice = { username: 'alice' }
const bob = { username: 'bob' }
const carol = { username: 'carol' }

describe('partyByline', () => {
	it('remixed using a collection: the source creator behind the creator', () => {
		expect(
			partyByline({ user: alice, sourceParty: { user: bob }, collectionSourceUser: carol })
		).toEqual({
			kind: 'pair',
			back: bob,
			front: alice,
			text: "alice remixed bob's team using carol's collection"
		})
	})

	it('remixed', () => {
		expect(partyByline({ user: alice, sourceParty: { user: bob } })).toEqual({
			kind: 'pair',
			back: bob,
			front: alice,
			text: "alice remixed bob's team"
		})
	})

	it('remixed without an account', () => {
		expect(partyByline({ sourceParty: { user: bob } })).toMatchObject({ kind: 'plain' })
	})

	it("remixed from a team without an account links the creator's profile", () => {
		expect(partyByline({ user: alice, sourceParty: { user: null } })).toMatchObject({
			kind: 'link',
			user: alice
		})
	})

	it('remixed between teams without accounts', () => {
		expect(partyByline({ sourceParty: {} })).toMatchObject({ kind: 'plain' })
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
		expect(partyByline({ user: alice })).toEqual({ kind: 'link', user: alice, text: 'alice' })
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
