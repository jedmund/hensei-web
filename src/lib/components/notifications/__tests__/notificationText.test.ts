import { describe, expect, it } from 'vitest'
import type { AppNotification } from '$lib/types/api/notification'
import {
	isPendingAction,
	notificationHref,
	notificationMessage,
	notificationStateLabel
} from '../notificationText'

function notification(overrides: Partial<AppNotification>): AppNotification {
	return {
		id: 'n1',
		kind: 'sticker_received',
		count: 1,
		read: false,
		state: null,
		createdAt: '2026-11-26T00:00:00Z',
		updatedAt: '2026-11-26T00:00:00Z',
		actor: null,
		party: { shortcode: 'abc123', name: 'Mine' },
		remix: null,
		sticker: null,
		event: null,
		crew: null,
		invitationId: null,
		phantom: null,
		...overrides
	}
}

describe('notificationMessage', () => {
	it('names the sticker for one, and counts several', () => {
		const sticker = {
			id: 's',
			slug: 'cleared',
			meaning: { en: 'Cleared with this', ja: 'これでクリア' },
			imageUrl: null,
			imageUrlJa: null,
			position: 0,
			active: true
		}
		expect(notificationMessage(notification({ sticker }))).toContain('Cleared with this')
		expect(notificationMessage(notification({ sticker, count: 3 }))).toContain('3 stickers')
	})

	it('says "Someone" for a remix without a public remixer', () => {
		const message = notificationMessage(notification({ kind: 'party_remixed' }))
		expect(message).toContain('Someone')
	})

	it('names the remixer and the others', () => {
		const actor = { username: 'jed', avatar: null }
		expect(notificationMessage(notification({ kind: 'party_remixed', actor }))).toContain('jed')
		expect(notificationMessage(notification({ kind: 'party_remixed', actor, count: 3 }))).toContain(
			'2 others'
		)
		expect(notificationMessage(notification({ kind: 'party_remixed', actor, count: 2 }))).toContain(
			'jed and 1 other remixed'
		)
	})

	it('falls back to "Untitled team"', () => {
		const message = notificationMessage(
			notification({ kind: 'party_featured', party: { shortcode: 'x', name: null } })
		)
		expect(message).toContain('Untitled team')
	})
})

describe('notificationHref', () => {
	it('links a public remix, else the recipient’s own team', () => {
		const remix = { shortcode: 'rmx', name: null }
		expect(notificationHref(notification({ kind: 'party_remixed', remix }))).toContain('/teams/rmx')
		expect(notificationHref(notification({ kind: 'party_remixed' }))).toContain('/teams/abc123')
	})

	it('sends crew notifications to the crew page', () => {
		expect(notificationHref(notification({ kind: 'crew_invited', party: null }))).toContain('/crew')
	})
})

describe('states', () => {
	it('only offers actions while pending', () => {
		expect(isPendingAction(notification({ kind: 'crew_invited', state: 'pending' }))).toBe(true)
		expect(isPendingAction(notification({ kind: 'crew_invited', state: 'expired' }))).toBe(false)
		expect(notificationStateLabel('pending')).toBeNull()
		expect(notificationStateLabel('accepted')).toBe('Joined')
	})
})
