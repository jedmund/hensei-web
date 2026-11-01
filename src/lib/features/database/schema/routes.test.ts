import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import type { ParamMatcher } from '@sveltejs/kit'
import { match as resource } from '../../../../params/resource'
import { match as socialProvider } from '../../../../params/socialProvider'
import { match as tab } from '../../../../params/tab'
import { weaponsResource } from '$lib/features/database/weapons/resource'
import { loadRecord, loadScreen, redirectMovedView } from './routes'

const getWeapon = vi.hoisted(() => vi.fn())
vi.mock('$lib/api/adapters/weapon.adapter', () => ({ weaponAdapter: { getWeapon } }))

const MATCHERS: Record<string, ParamMatcher> = { resource, socialProvider, tab }

/**
 * Route ids in the order SvelteKit tries them: the client manifest's
 * dictionary, as `svelte-kit sync` (run by `pnpm install` and `pnpm check`)
 * writes it.
 */
function routeIds(): string[] {
	const path = fileURLToPath(
		new URL('../../../../../.svelte-kit/generated/client/app.js', import.meta.url)
	)
	const source = readFileSync(path, 'utf8')
	const dictionary = source.slice(source.indexOf('export const dictionary'))
	return [...dictionary.matchAll(/^\t\t"([^"]+)":/gm)].map((m) => m[1]!)
}

/** Whether a route id matches a pathname: groups dropped, params checked by their matchers */
function matches(id: string, pathname: string): boolean {
	const segments = id.split('/').filter((s) => s && !/^\(.+\)$/.test(s))
	const parts = pathname.split('/').filter(Boolean)
	let i = 0
	for (const segment of segments) {
		const param = /^\[(\[)?(?:\.\.\.)?(\w+)(?:=(\w+))?\]?\]$/.exec(segment)
		if (!param) {
			if (parts[i] !== segment) return false
			i++
			continue
		}
		const [, optional, , matcher] = param
		if (segment.startsWith('[...')) return true
		const part = parts[i]
		const ok = part !== undefined && (!matcher || MATCHERS[matcher]!(part))
		if (ok) i++
		else if (!optional) return false
	}
	return i === parts.length
}

function routeFor(pathname: string): string | undefined {
	return routeIds().find((id) => matches(id, pathname))
}

describe('generic database routes', () => {
	it('serve registered resources at their old URLs', () => {
		const generic = '/(app)/database/[resource=resource]'
		expect(routeFor('/database/weapons')).toBe(generic)
		expect(routeFor('/database/weapons/1040001000')).toBe(`${generic}/[id]`)
		expect(routeFor('/database/weapons/1040001000/edit')).toBe(`${generic}/[id]/edit`)
		expect(routeFor('/database/weapons/new')).toBe(`${generic}/new`)
		expect(routeFor('/database/characters')).toBe(generic)
		expect(routeFor('/database/characters/3040001000')).toBe(`${generic}/[id]`)
		expect(routeFor('/database/characters/3040001000/edit')).toBe(`${generic}/[id]/edit`)
		expect(routeFor('/database/characters/new')).toBe(`${generic}/new`)
		expect(routeFor('/database/summons')).toBe(generic)
		expect(routeFor('/database/summons/2040001000')).toBe(`${generic}/[id]`)
		expect(routeFor('/database/summons/2040001000/edit')).toBe(`${generic}/[id]/edit`)
		expect(routeFor('/database/summons/new')).toBe(`${generic}/new`)
		expect(routeFor('/database/raids')).toBe(generic)
		expect(routeFor('/database/raids/lucilius-hard')).toBe(`${generic}/[id]`)
		expect(routeFor('/database/raids/lucilius-hard/edit')).toBe(`${generic}/[id]/edit`)
		expect(routeFor('/database/raids/new')).toBe(`${generic}/new`)
		expect(routeFor('/database/raid-groups/0b6f2c4e')).toBe(`${generic}/[id]`)
		expect(routeFor('/database/raid-groups/new')).toBe(`${generic}/new`)
		expect(routeFor('/database/events')).toBe(generic)
		expect(routeFor('/database/events/0b6f2c4e')).toBe(`${generic}/[id]`)
		expect(routeFor('/database/events/new')).toBe(`${generic}/new`)
	})

	it('serve slug-keyed resources at their new URLs', () => {
		const generic = '/(app)/database/[resource=resource]'
		for (const name of [
			'weapon-series',
			'character-series',
			'awakenings',
			'jobs',
			'job-skills',
			'job-accessories'
		]) {
			expect(routeFor(`/database/${name}`)).toBe(generic)
			expect(routeFor(`/database/${name}/some-slug`)).toBe(`${generic}/[id]`)
			expect(routeFor(`/database/${name}/some-slug/edit`)).toBe(`${generic}/[id]/edit`)
			expect(routeFor(`/database/${name}/new`)).toBe(`${generic}/new`)
		}
	})

	it('leave bespoke routes in charge', () => {
		expect(routeFor('/database/weapons/import')).toBe('/(app)/database/weapons/import')
		expect(routeFor('/database/weapon-skills/ATK')).toBe('/(app)/database/weapon-skills/[modifier]')
		expect(routeFor('/database/characters/import')).toBe('/(app)/database/characters/import')
		expect(routeFor('/database/characters/3040001000/style')).toBe(
			'/(app)/database/characters/[granblueId]/style'
		)
		expect(routeFor('/database/characters/3040001000/style/edit')).toBe(
			'/(app)/database/characters/[granblueId]/style/edit'
		)
		expect(routeFor('/database/summons/import')).toBe('/(app)/database/summons/import')
		// The old series pages redirect from the server (a +server.ts, not a page)
		expect(routeFor('/database/series/weapons/new') ?? '').not.toContain('[resource=resource]')
		expect(routeFor('/database/bullets/1')).toBe('/(app)/database/bullets/[granblueId]')
	})

	it('match nothing for an unregistered resource', () => {
		expect(routeFor('/database/widgets') ?? '').not.toContain('[resource=resource]')
	})
})

describe('loadScreen', () => {
	it("resolves a resource's screen", async () => {
		// Stand-in component: importing the real screen compiles its whole graph
		const Screen = () => ({})
		vi.spyOn(weaponsResource.screens!, 'list').mockResolvedValueOnce({ default: Screen })
		expect(await loadScreen('weapons', 'list')).toBe(Screen)
	})

	it('generates the detail for a resource with a record and no override', async () => {
		const { default: generated } = await import('./ResourceDetailScreen.svelte')
		expect(weaponsResource.screens?.detail).toBeUndefined()
		expect(await loadScreen('weapons', 'detail')).toBe(generated)
	})

	it('generates the edit page for a resource with a record it can save', async () => {
		const { default: generated } = await import('./ResourceEditScreen.svelte')
		expect(weaponsResource.screens?.edit).toBeUndefined()
		expect(await loadScreen('weapons', 'edit')).toBe(generated)
	})

	it('generates the new page for a resource with a record it can create', async () => {
		const { default: generated } = await import('./ResourceNewScreen.svelte')
		expect(weaponsResource.screens?.new).toBeUndefined()
		expect(await loadScreen('weapons', 'new')).toBe(generated)
	})

	it('generates the lists of the job resources, which have no list override', async () => {
		const { default: generated } = await import('./ResourceListScreen.svelte')
		for (const name of ['jobs', 'job-skills', 'job-accessories']) {
			expect(await loadScreen(name, 'list')).toBe(generated)
		}
	})

	it('overrides nothing for weapons but the list', () => {
		expect(Object.keys(weaponsResource.screens ?? {})).toEqual(['list'])
	})

	it('generates the list for a resource with no list override', async () => {
		const { summonsResource } = await import('$lib/features/database/summons/resource')
		const { default: generated } = await import('./ResourceListScreen.svelte')
		expect(summonsResource.screens?.list).toBeUndefined()
		expect(await loadScreen('summons', 'list')).toBe(generated)
	})

	it('generates the ordered list, detail, edit and new pages for an ordered resource', async () => {
		const { default: orderedList } = await import('./ResourceOrderedListScreen.svelte')
		expect(await loadScreen('character-roles', 'list')).toBe(orderedList)
		const { default: edit } = await import('./ResourceEditScreen.svelte')
		expect(await loadScreen('character-roles', 'edit')).toBe(edit)
		const { default: create } = await import('./ResourceNewScreen.svelte')
		expect(await loadScreen('character-roles', 'new')).toBe(create)
	})

	it('404s an unregistered resource', async () => {
		await expect(loadScreen('widgets', 'list')).rejects.toMatchObject({ status: 404 })
	})
})

describe('redirectMovedView', () => {
	const url = (path: string) => new URL(path, 'http://localhost')

	it('sends the old Series and Awakenings tabs to their own lists', () => {
		const moved = (path: string) => {
			try {
				redirectMovedView(path.split(/[/?]/)[2]!, url(path))
			} catch (redirect) {
				return redirect
			}
		}
		expect(moved('/database/weapons?view=series')).toMatchObject({
			status: 301,
			location: '/database/weapon-series'
		})
		expect(moved('/database/weapons?view=awakenings')).toMatchObject({
			location: '/database/awakenings'
		})
		expect(moved('/database/characters?view=series')).toMatchObject({
			location: '/database/character-series'
		})
	})

	it('leaves other views and plain lists alone', () => {
		expect(() => redirectMovedView('weapons', url('/database/weapons?view=skills'))).not.toThrow()
		expect(() => redirectMovedView('weapons', url('/database/weapons'))).not.toThrow()
	})
})

describe('loadRecord', () => {
	it("returns the resource's full record under `record`", async () => {
		getWeapon.mockResolvedValueOnce({ granblueId: '1040001000' })
		expect(await loadRecord('weapons', '1040001000')).toEqual({
			record: { granblueId: '1040001000' }
		})
		expect(getWeapon).toHaveBeenLastCalledWith('1040001000')
	})

	it('404s a missing record and 500s anything else', async () => {
		getWeapon.mockRejectedValueOnce({ name: 'AdapterError', code: 'NOT_FOUND', status: 404 })
		await expect(loadRecord('weapons', '1')).rejects.toMatchObject({ status: 404 })

		vi.spyOn(console, 'error').mockImplementationOnce(() => {})
		getWeapon.mockRejectedValueOnce(new Error('down'))
		await expect(loadRecord('weapons', '1')).rejects.toMatchObject({ status: 500 })
	})
})

describe('redirectMovedView', () => {
	const url = (path: string) => new URL(path, 'http://localhost')

	it("sends a list's old ?view= tab to the resource that replaced it", () => {
		expect(() => redirectMovedView('raids', url('/database/raids?view=groups'))).toThrow(
			expect.objectContaining({ status: 301, location: '/database/raid-groups' })
		)
		expect(() => redirectMovedView('weapons', url('/database/weapons?view=series'))).toThrow(
			expect.objectContaining({ status: 301, location: '/database/weapon-series' })
		)
	})

	it('leaves other views and lists alone', () => {
		expect(() => redirectMovedView('raids', url('/database/raids'))).not.toThrow()
		expect(() => redirectMovedView('raids', url('/database/raids?view=other'))).not.toThrow()
		expect(() => redirectMovedView('weapons', url('/database/weapons?view=skills'))).not.toThrow()
	})
})
