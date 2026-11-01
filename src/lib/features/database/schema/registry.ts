/**
 * Every resource with a schema definition, by route segment. The generic
 * routes (GBF-142 phase 3) match only these names.
 */
import { artifactSkillsResource } from '$lib/features/database/artifact-skills/resource'
import { awakeningsResource } from '$lib/features/database/awakenings/resource'
import { characterSeriesResource } from '$lib/features/database/character-series/resource'
import { charactersResource } from '$lib/features/database/characters/resource'
import { jobAccessoriesResource } from '$lib/features/database/job-accessories/resource'
import { jobSkillsResource } from '$lib/features/database/job-skills/resource'
import { jobsResource } from '$lib/features/database/jobs/resource'
import { weaponSeriesResource } from '$lib/features/database/weapon-series/resource'
import { eventsResource } from '$lib/features/database/events/resource'
import { raidGroupsResource } from '$lib/features/database/raid-groups/resource'
import { raidsResource } from '$lib/features/database/raids/resource'
import { summonsResource } from '$lib/features/database/summons/resource'
import { weaponsResource } from '$lib/features/database/weapons/resource'
import { isResourceName, type ResourceName } from './names'
import type { ResourceDef } from './types'

// The registry boundary is untyped: each definition keeps its own row types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResourceDef = ResourceDef<any, any>

/** Keyed by `def.name`; the type requires exactly the names in `RESOURCE_NAMES` */
export const RESOURCES: Record<ResourceName, AnyResourceDef> = {
	weapons: weaponsResource,
	characters: charactersResource,
	summons: summonsResource,
	raids: raidsResource,
	'raid-groups': raidGroupsResource,
	events: eventsResource,
	'weapon-series': weaponSeriesResource,
	'character-series': characterSeriesResource,
	awakenings: awakeningsResource,
	jobs: jobsResource,
	'job-skills': jobSkillsResource,
	'job-accessories': jobAccessoriesResource,
	'artifact-skills': artifactSkillsResource
}

export function resourceDef(name: string): AnyResourceDef | undefined {
	return isResourceName(name) ? RESOURCES[name] : undefined
}
