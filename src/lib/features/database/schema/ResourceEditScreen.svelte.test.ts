import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/weapons/1040620200/edit'),
	params: { resource: 'weapons', id: '1040620200' } as Record<string, string>,
	state: {},
	data: {}
}))

// jsdom has no ResizeObserver or matchMedia; hoisted, as modules read them on import
vi.hoisted(() => {
	globalThis.ResizeObserver ??= class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver
	window.matchMedia ??= ((query: string) => ({
		matches: true,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	})) as unknown as typeof window.matchMedia
})

vi.mock('$app/state', () => ({ page: pageState }))
vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto: vi.fn(async () => {}) }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

// One client for the whole file, in place of the app layout's provider
const queries = vi.hoisted(() => ({
	clear: () => {},
	seed: (() => {}) as (key: unknown[], data: unknown) => void
}))
vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const client = new actual.QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } }
	})
	queries.clear = () => client.clear()
	queries.seed = (key, data) => client.setQueryData(key, data)
	return {
		...actual,
		useQueryClient: () => client,
		createQuery: ((options: never) =>
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

import { detailRecords } from '$lib/features/database/weapons/__fixtures__/detailRecords'
import ResourceEditScreen from './ResourceEditScreen.svelte'

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

function render(name: keyof typeof detailRecords, overrides: Record<string, unknown> = {}) {
	const record = { ...detailRecords[name], ...overrides }
	pageState.params.id = record.granblueId
	// What the series and awakening inputs load
	queries.seed(['weaponSeries', 'list'], [record.series].filter(Boolean))
	queries.seed(['weaponSeries', record.series?.id ?? ''], {
		...record.series,
		variants: [{ id: 'variant-forged', name: 'Forged' }]
	})
	queries.seed(['awakenings', 'Weapon'], [])
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceEditScreen, {
		target,
		props: { data: { record, role: 7, resource: 'weapons' } }
	})
	flushSync()
}

const titles = () => [...target.querySelectorAll('.details h4')].map(text)
const labels = () => [...target.querySelectorAll('.details .label')].map(text)
const text = (el: Element) => el.textContent?.trim() ?? ''

function checkbox(label: string): HTMLElement {
	const item = [...target.querySelectorAll('.detail-item')].find(
		(i) => i.querySelector('.label')?.textContent === label
	)
	return item!.querySelector<HTMLElement>('button[role="checkbox"]')!
}

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

describe('ResourceEditScreen', () => {
	it('puts Back, the title and Save above the form', () => {
		render('gunNull')
		expect([...target.querySelectorAll('header a, header button')].map(text)).toEqual(
			expect.arrayContaining(['Back', 'Save'])
		)
		expect(target.textContent).toContain('Edit Weapon')
		expect(target.querySelector('a[href="/database/weapons/1040620200"]')).not.toBeNull()
	})

	it('draws the edit sections, with the inputs for what this weapon shows', () => {
		render('gunNull', { proficiency: 6 })
		const shown = labels()
		// Element-changeable gun: variant IDs, bullet slots, the series variant
		expect(shown).toEqual(
			expect.arrayContaining(['Name (EN)', 'Name (JP)', 'Granblue ID', 'Variant', 'Awakening'])
		)
		expect(shown).toContain('Max Awakening Level')
		expect(target.querySelectorAll('.variant-input')).toHaveLength(6)
		expect(target.textContent).toContain('Add slot')
		// Read-only fields have no input
		expect(shown).not.toContain('Forge Chain')
		// Not a gun: no bullet slots
		unmount(mounted!)
		mounted = null
		target.remove()
		render('gunNull')
		expect(target.textContent).not.toContain('Add slot')
		// Every section but Bullet Slots
		expect(titles()).toEqual([
			'Metadata',
			'Element Variant IDs',
			'Gacha',
			'Uncap',
			'Details',
			'HP Stats',
			'Attack Stats',
			'Caps',
			'Awakenings',
			'Forge Chain',
			'Nicknames',
			'Dates',
			'Links'
		])
	})

	it('hides what a plain weapon lacks', () => {
		render('plain')
		expect(target.querySelectorAll('.variant-input')).toHaveLength(0)
		expect(target.textContent).not.toContain('Add slot')
		// Not uncapped: no FLB stats or dates
		expect(labels()).not.toContain('Max HP (FLB)')
		// No awakening level: the switch is off and the level hidden
		expect(labels()).not.toContain('Max Awakening Level')
		expect(checkbox('Awakening').getAttribute('aria-checked')).toBe('false')
	})

	it('shows and hides fields as the values change', () => {
		render('gunNull')
		checkbox('Awakening').click()
		flushSync()
		expect(labels()).not.toContain('Max Awakening Level')

		expect(labels()).toContain('Max HP (FLB)')
		checkbox('FLB').click()
		flushSync()
		// Unticking FLB unticks ULB and hides the uncap stats
		expect(labels()).not.toContain('Max HP (FLB)')
		expect(checkbox('ULB').getAttribute('aria-checked')).toBe('false')
	})
})
