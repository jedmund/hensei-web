/**
 * Stickers in the database sidebar, under Site. Kept apart from the
 * definition: the sidebar is on every page and mustn't load it.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const stickersSection: ResourceSection = {
	label: () => m.nav_stickers(),
	group: 'site',
	entity: () => m.type_sticker(),
	actions: [[{ label: () => m.db_stickers_new(), href: 'new' }]]
}
