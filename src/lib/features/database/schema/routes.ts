/**
 * Loads for the generic `/database/[resource=resource]` routes: each
 * dispatches to the resource's definition, so the routes name no resource.
 */
import { error, redirect } from '@sveltejs/kit'
import { resourceDef, type AnyResourceDef } from './registry'
import type { ScreenComponent, ScreenKind } from './types'

function definition(resource: string): AnyResourceDef {
	const def = resourceDef(resource)
	if (!def) error(404, 'Not found')
	return def
}

/**
 * Generated screens, for resources with no override. Every resource has a
 * list; the detail needs a `record`, the edit page a `record` it can
 * `save.update`, the new page one it can `save.create`
 */
function generated(
	def: AnyResourceDef,
	kind: ScreenKind
): (() => Promise<{ default: unknown }>) | undefined {
	if (kind === 'list') return () => import('./ResourceListScreen.svelte')
	if (kind === 'detail' && def.record) return () => import('./ResourceDetailScreen.svelte')
	if (kind === 'edit' && def.record && def.save?.update) {
		return () => import('./ResourceEditScreen.svelte')
	}
	if (kind === 'new' && def.record && def.save?.create) {
		return () => import('./ResourceNewScreen.svelte')
	}
	return undefined
}

/** The resource's screen for a route, if it has one: its override, else the generated one */
export function screenFor(
	def: AnyResourceDef,
	kind: ScreenKind
): (() => Promise<{ default: unknown }>) | undefined {
	return def.screens?.[kind] ?? generated(def, kind)
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
	const screen = screenFor(def, kind)
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

/**
 * Sends an old `?view=` sub-section URL to the resource that replaced it
 * (`list.movedViews`), e.g. `/database/raids?view=groups` → `/database/raid-groups`
 */
export function redirectMovedView(resource: string, url: URL): void {
	const view = url.searchParams.get('view')
	const target = view ? definition(resource).list.movedViews?.[view] : undefined
	if (target) redirect(301, target)
}
