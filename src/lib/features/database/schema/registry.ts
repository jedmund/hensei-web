/**
 * Every resource with a schema definition, by route segment. The generic
 * routes (GBF-142 phase 3) match only these names.
 */
import { weaponsResource } from '$lib/features/database/weapons/resource'
import type { ResourceDef } from './types'

// The registry boundary is untyped: each definition keeps its own row types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyResourceDef = ResourceDef<any, any>

export const RESOURCES: Record<string, AnyResourceDef> = {
	[weaponsResource.name]: weaponsResource
}

export function resourceDef(name: string): AnyResourceDef | undefined {
	return Object.hasOwn(RESOURCES, name) ? RESOURCES[name] : undefined
}
