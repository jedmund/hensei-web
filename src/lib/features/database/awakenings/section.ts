/**
 * Awakenings in the database sidebar, nested under Weapons (whose "New" menu
 * it shares). Kept apart from the definition: the sidebar is on every page
 * and mustn't load it.
 */
import { m } from '$lib/paraglide/messages'
import type { ResourceSection } from '$lib/features/database/sections'

export const awakeningsSection: ResourceSection = {
	label: () => m.db_nav_awakenings(),
	group: 'catalogue'
}
