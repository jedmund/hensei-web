/**
 * Raid section mapping utilities
 */

import * as m from '$lib/paraglide/messages'

export enum RaidSection {
	Farming = 0,
	Raid = 1,
	Event = 2,
	Solo = 3
}

/**
 * Get the localized display name for a raid section
 */
export function getRaidSectionLabel(section: number | string | null | undefined): string {
	if (section === null || section === undefined) return '-'
	const num = typeof section === 'string' ? parseInt(section, 10) : section

	switch (num) {
		case RaidSection.Farming:
			return m.raid_section_farming()
		case RaidSection.Raid:
			return m.raid_section_raid()
		case RaidSection.Event:
			return m.raid_section_event()
		case RaidSection.Solo:
			return m.raid_section_solo()
		default:
			return '-'
	}
}
