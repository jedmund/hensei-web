/**
 * Every resource with a schema definition, by route segment. The generic
 * routes (GBF-142 phase 3) match only these names.
 */
import { charactersResource } from '$lib/features/database/characters/resource'
import { eventsResource } from '$lib/features/database/events/resource'
import { raidGroupsResource } from '$lib/features/database/raid-groups/resource'
import { raidsResource } from '$lib/features/database/raids/resource'
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
	raids: raidsResource,
	'raid-groups': raidGroupsResource,
	events: eventsResource
}

export function resourceDef(name: string): AnyResourceDef | undefined {
	return isResourceName(name) ? RESOURCES[name] : undefined
}
