// What a notification row says and where it leads (GBF-82). Pure, so the
// popover, the pane and the tests share it.

import { m } from '$lib/paraglide/messages'
import { localizeHref } from '$lib/paraglide/runtime'
import { localizedName } from '$lib/utils/locale'
import type { AppNotification, NotificationState } from '$lib/types/api/notification'

function teamName(notification: AppNotification): string {
	return notification.party?.name || m.party_untitled()
}

function actorName(notification: AppNotification): string {
	return notification.actor?.displayName || notification.actor?.username || ''
}

export function notificationMessage(notification: AppNotification): string {
	const team = teamName(notification)
	const count = notification.count

	switch (notification.kind) {
		case 'sticker_received': {
			const sticker = notification.sticker ? localizedName(notification.sticker.meaning) : ''
			return count > 1 || !sticker
				? m.notifications_sticker_many({ team, count })
				: m.notifications_sticker_one({ team, sticker })
		}
		case 'party_remixed': {
			const username = actorName(notification)
			if (!username) {
				return count > 1
					? m.notifications_remix_many({ team, count })
					: m.notifications_remix_someone({ team })
			}
			return count > 1
				? m.notifications_remix_named_others({ username, others: count - 1, team })
				: m.notifications_remix_named({ username, team })
		}
		case 'party_featured':
			return notification.event
				? m.notifications_featured_event({ team, event: localizedName(notification.event.name) })
				: m.notifications_featured({ team })
		case 'crew_invited':
			return m.notifications_crew_invited({
				username: actorName(notification),
				crew: notification.crew?.name ?? ''
			})
		case 'phantom_assigned':
			return m.notifications_phantom_assigned({
				crew: notification.crew?.name ?? '',
				name: notification.phantom?.name ?? ''
			})
	}
}

/** A label for a resolved invitation or phantom; null while pending or for passive kinds */
export function notificationStateLabel(state: NotificationState | null): string | null {
	switch (state) {
		case 'accepted':
			return m.notifications_state_accepted()
		case 'rejected':
			return m.notifications_state_rejected()
		case 'expired':
			return m.crew_expired()
		case 'confirmed':
			return m.notifications_state_confirmed()
		case 'unassigned':
			return m.notifications_state_unassigned()
		default:
			return null
	}
}

/** Where clicking the row goes. A remix links to the remix only while it is public. */
export function notificationHref(notification: AppNotification): string | null {
	switch (notification.kind) {
		case 'party_remixed':
			if (notification.remix) return localizeHref(`/p/${notification.remix.shortcode}`)
			return notification.party ? localizeHref(`/p/${notification.party.shortcode}`) : null
		case 'sticker_received':
		case 'party_featured':
			return notification.party ? localizeHref(`/p/${notification.party.shortcode}`) : null
		case 'crew_invited':
		case 'phantom_assigned':
			return localizeHref('/crew')
	}
}

/** Waiting on the user: show Accept/Decline */
export function isPendingAction(notification: AppNotification): boolean {
	return notification.state === 'pending'
}
