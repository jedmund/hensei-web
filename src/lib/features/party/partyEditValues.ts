import type { Raid } from '$lib/types/api/entities'
import type { Party } from '$lib/types/api/party'
import type { RaidFull } from '$lib/types/api/raid'
import type { PartyVisibility } from '$lib/types/visibility'

/** The party metadata edited in EditPartyPane */
export interface PartyEditValues {
	name: string
	description: string | null
	visibility: PartyVisibility
	sharedWithCrew: boolean
	fullAuto: boolean
	solo: boolean
	autoGuard: boolean
	autoSummon: boolean
	chargeAttack: boolean
	clearTime: number | null
	buttonCount: number | null
	chainCount: number | null
	summonCount: number | null
	videoUrl: string | null
	raid: Raid | null
	raidId: string | null
}

/** The Evoking Solomonis row under Raid */
export interface SolomonisDetailsLink {
	label: string
	/** e.g. "Nier · Pledge 3" */
	summary: string
	getParty: () => Party
	canEdit: boolean
}

/** Fields compared for unsaved changes; the raid object is tracked by raidId */
const COMPARED_FIELDS = [
	'name',
	'visibility',
	'sharedWithCrew',
	'fullAuto',
	'solo',
	'autoGuard',
	'autoSummon',
	'chargeAttack',
	'clearTime',
	'buttonCount',
	'chainCount',
	'summonCount',
	'videoUrl',
	'raidId',
	'description'
] as const satisfies readonly Exclude<keyof PartyEditValues, 'raid'>[]

/** Whether any edited field differs from the values the pane opened with */
export function partyEditValuesChanged(
	initial: PartyEditValues,
	current: PartyEditValues
): boolean {
	return COMPARED_FIELDS.some((field) => current[field] !== initial[field])
}

/** Narrow a raid from the raid picker to the Raid shape stored on a party */
export function raidFullToRaid(raid: RaidFull): Raid {
	return {
		id: raid.id,
		slug: raid.slug,
		name: raid.name,
		level: raid.level,
		element: raid.element,
		group: raid.group
			? {
					id: raid.group.id,
					name: raid.group.name,
					section: String(raid.group.section),
					order: raid.group.order,
					difficulty: raid.group.difficulty,
					hl: raid.group.hl,
					extra: raid.group.extra,
					guidebooks: raid.group.guidebooks,
					unlimited: raid.group.unlimited,
					supportSummon: raid.group.supportSummon ?? true,
					contentMode: raid.group.contentMode ?? null
				}
			: undefined,
		extra: raid.extra
	}
}
