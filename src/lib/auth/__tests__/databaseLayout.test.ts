/**
 * The database layout is the role gate for every Database page: curators
 * reach the Events resource (and the root), editors everything.
 */
import { describe, expect, it } from 'vitest'
import { load } from '../../../routes/(app)/database/+layout.server'
import { load as loadNew } from '../../../routes/(app)/database/[resource=resource]/new/+page'
import { load as loadEdit } from '../../../routes/(app)/database/[resource=resource]/[id]/edit/+page.server'

const GENERIC = '/(app)/database/[resource=resource]'

type LayoutEvent = Parameters<typeof load>[0]

function gate(role: number, routeId: string, resource?: string) {
	return load({
		locals: { session: { isAuthenticated: true, account: { role }, user: null } },
		route: { id: routeId },
		params: resource ? { resource } : {}
	} as unknown as LayoutEvent)
}

async function redirectOf(promise: Promise<unknown> | unknown): Promise<string | null> {
	try {
		await promise
		return null
	} catch (err) {
		return (err as { location?: string }).location ?? 'threw'
	}
}

describe('database layout role gate', () => {
	it('lets curators read Events, list and detail', async () => {
		expect(await redirectOf(gate(6, GENERIC, 'events'))).toBeNull()
		expect(await redirectOf(gate(6, `${GENERIC}/[id]`, 'events'))).toBeNull()
	})

	it('keeps curators out of every other resource and bespoke page', async () => {
		expect(await redirectOf(gate(6, GENERIC, 'raids'))).toBe('/')
		expect(await redirectOf(gate(6, `${GENERIC}/[id]`, 'raid-groups'))).toBe('/')
		expect(await redirectOf(gate(6, GENERIC, 'weapons'))).toBe('/')
		expect(await redirectOf(gate(6, '/(app)/database/summons'))).toBe('/')
	})

	it('lets editors in everywhere', async () => {
		for (const resource of ['events', 'raids', 'raid-groups', 'weapons']) {
			expect(await redirectOf(gate(7, GENERIC, resource))).toBeNull()
		}
		expect(await redirectOf(gate(7, '/(app)/database/summons'))).toBeNull()
	})

	it("sends curators back from an event's edit and new pages", async () => {
		const parent = async () => ({ role: 6 })
		expect(
			await redirectOf(
				loadEdit({ params: { resource: 'events', id: 'e-1' }, parent } as unknown as Parameters<
					typeof loadEdit
				>[0])
			)
		).toBe('/database/events/e-1')
		expect(
			await redirectOf(
				loadNew({ params: { resource: 'events' }, parent } as unknown as Parameters<
					typeof loadNew
				>[0])
			)
		).toBe('/database/events')
	})
})
