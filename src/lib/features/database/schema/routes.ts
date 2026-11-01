/**
 * Loads for the generic `/database/[resource=resource]` routes: each
 * dispatches to the resource's definition, so the routes name no resource.
 */
import { error } from '@sveltejs/kit'
import { resourceDef, type AnyResourceDef } from './registry'
import type { ScreenComponent, ScreenKind } from './types'

function definition(resource: string): AnyResourceDef {
	const def = resourceDef(resource)
	if (!def) error(404, 'Not found')
	return def
}

/** Generated screens, for resources with no override. The detail needs a `record` */
function generated(
	def: AnyResourceDef,
	kind: ScreenKind
): (() => Promise<{ default: unknown }>) | undefined {
	if (kind === 'detail' && def.record) return () => import('./ResourceDetailScreen.svelte')
	return undefined
}

/**
 * The screen component for a route: the resource's override, else the
 * generated one. Resolved in the universal load so it server-renders; each
 * screen is its own chunk.
 */
export async function loadScreen<K extends ScreenKind>(
	resource: string,
	kind: K
): Promise<ScreenComponent<K>> {
	const def = definition(resource)
	const screen = def.screens?.[kind] ?? generated(def, kind)
	if (!screen) error(404, 'Not found')
	return (await screen()).default as ScreenComponent<K>
}

/** The full record for the detail and edit pages, under `record` (the breadcrumb reads it) */
export async function loadRecord(resource: string, id: string): Promise<{ record: unknown }> {
	const record = definition(resource).record
	if (!record) error(404, 'Not found')

	try {
		return { record: await record.fetch(id) }
	} catch (err) {
		// Adapters reject with plain AdapterError objects, not Error instances
		if (typeof err === 'object' && err !== null && 'status' in err && err.status === 404) {
			error(404, 'Record not found')
		}
		console.error(`Failed to load ${resource} ${id}:`, err)
		error(500, 'Failed to load record')
	}
}
