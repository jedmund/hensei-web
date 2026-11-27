// Notifications, as NotificationBlueprint returns them (GBF-82).

import type { LocalizedName } from './entities'
import type { Sticker } from './sticker'
import type { AvatarUser } from '$lib/utils/avatar'

export type NotificationKind =
	'sticker_received' | 'party_remixed' | 'party_featured' | 'crew_invited' | 'phantom_assigned'

/** Invitations: pending/accepted/rejected/expired. Phantoms: pending/confirmed/unassigned. */
export type NotificationState =
	'pending' | 'accepted' | 'rejected' | 'expired' | 'confirmed' | 'unassigned'

export interface NotificationPartyRef {
	shortcode: string
	name: string | null
}

export interface AppNotification {
	id: string
	kind: NotificationKind
	/** How many events this row groups (stickers, remixes) */
	count: number
	read: boolean
	/** Null for passive kinds */
	state: NotificationState | null
	createdAt: string
	updatedAt: string
	/** Never set for stickers; for remixes, only while the remix is public */
	actor: (AvatarUser & { displayName?: string | null }) | null
	/** The recipient's own team (stickers, remixes, features) */
	party: NotificationPartyRef | null
	/** The latest remix, only while it is public */
	remix: NotificationPartyRef | null
	sticker: Sticker | null
	event: { id: string; name: LocalizedName } | null
	crew: { id: string; name: string; gamertag: string | null } | null
	/** crew_invited only: the invitation to accept or reject */
	invitationId: string | null
	phantom: { id: string; name: string } | null
}

export interface NotificationPage {
	notifications: AppNotification[]
	meta: { count: number; totalPages: number; perPage: number }
	unreadCount: number
}
