import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/weapons/new'),
	params: { resource: 'weapons' } as Record<string, string>,
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

const goto = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('$app/state', () => ({ page: pageState }))
vi.mock('$app/navigation', () => ({ beforeNavigate: vi.fn(), goto }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

const adapter = vi.hoisted(() => ({
	createWeapon: vi.fn(),
	validateWeaponGranblueId: vi.fn(),
	downloadWeaponImages: vi.fn()
}))
vi.mock('$lib/api/adapters/weapon.adapter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/adapters/weapon.adapter')>()
	return { ...actual, weaponAdapter: Object.assign(actual.weaponAdapter, adapter) }
})

// One client for the whole file, in place of the app layout's provider
vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const client = new actual.QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: Infinity } }
	})
	// What the series input loads
	client.setQueryData(['weaponSeries', 'list'], [])
	return {
		...actual,
		useQueryClient: () => client,
		createQuery: ((options: never) =>
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

import { fieldFor } from './fields'
import { weaponsResource } from '$lib/features/database/weapons/resource'
import ResourceNewScreen from './ResourceNewScreen.svelte'

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

function render() {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceNewScreen, { target })
	flushSync()
}

const text = (el: Element) => el.textContent?.trim() ?? ''
const titles = () => [...target.querySelectorAll('.details h4')].map(text)
const labels = () => [...target.querySelectorAll('.details .label')].map(text)

function input(label: string): HTMLInputElement {
	const item = [...target.querySelectorAll('.detail-item')].find(
		(i) => i.querySelector('.label')?.textContent === label
	)
	return item!.querySelector('input')!
}

function type(label: string, value: string) {
	const el = input(label)
	el.value = value
	el.dispatchEvent(new Event('input', { bubbles: true }))
	flushSync()
}

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	vi.restoreAllMocks()
})

describe('ResourceNewScreen', () => {
	it('puts Back, the title and Save above the form', () => {
		render()
		expect(target.textContent).toContain('New Weapon')
		expect(target.querySelector('header a[href="/database/weapons"]')).not.toBeNull()
		expect([...target.querySelectorAll('header button')].map(text)).toContain('Save')
	})

	it("draws the create sections, without what the new page didn't have", () => {
		render()
		expect(titles()).toEqual([
			'Metadata',
			'Gacha',
			'Uncap',
			'Details',
			'HP Stats',
			'Attack Stats',
			'Caps',
			'Forge Chain',
			'Nicknames',
			'Dates',
			'Links'
		])
		// Element 0 is the default, but variant IDs are set after the weapon exists
		expect(target.querySelectorAll('.variant-input')).toHaveLength(0)
		expect(labels()).toEqual(expect.arrayContaining(['Granblue ID', 'Name (EN)', 'Uncap']))
		// Not uncapped yet: no FLB stats or dates
		expect(labels()).not.toContain('Max HP (FLB)')
	})

	it('creates the weapon, queues its images and opens it', async () => {
		// A proficiency is required and picked from a menu; start from one instead
		const proficiency = fieldFor(weaponsResource, 'proficiency')
		vi.spyOn(proficiency, 'default', 'get').mockReturnValue(1)
		const saved = { id: 'new-uuid', granblueId: '1040914000' }
		adapter.validateWeaponGranblueId.mockResolvedValue({ valid: true, existsInDb: false })
		adapter.createWeapon.mockResolvedValue(saved)
		adapter.downloadWeaponImages.mockResolvedValue({})

		render()
		type('Granblue ID', '1040914000')
		type('Name (EN)', 'Fresh')
		;[...target.querySelectorAll<HTMLButtonElement>('header button')]
			.find((b) => text(b) === 'Save')!
			.click()

		await vi.waitFor(() => expect(goto).toHaveBeenCalledWith('/database/weapons/1040914000'))
		expect(adapter.validateWeaponGranblueId).toHaveBeenCalledWith('1040914000')
		expect(adapter.createWeapon).toHaveBeenCalledWith(
			expect.objectContaining({ granblue_id: '1040914000', name_en: 'Fresh', proficiency: 1 })
		)
		expect(adapter.downloadWeaponImages).toHaveBeenCalledWith('new-uuid')
	})

	it("doesn't save a Granblue ID that's taken", async () => {
		const proficiency = fieldFor(weaponsResource, 'proficiency')
		vi.spyOn(proficiency, 'default', 'get').mockReturnValue(1)
		adapter.validateWeaponGranblueId.mockResolvedValue({ valid: true, existsInDb: true })
		adapter.createWeapon.mockClear()
		goto.mockClear()

		render()
		type('Granblue ID', '1040001000')
		type('Name (EN)', 'Taken')
		;[...target.querySelectorAll<HTMLButtonElement>('header button')]
			.find((b) => text(b) === 'Save')!
			.click()

		await vi.waitFor(() =>
			expect(target.textContent).toContain('A weapon with this Granblue ID already exists')
		)
		expect(adapter.createWeapon).not.toHaveBeenCalled()
		expect(goto).not.toHaveBeenCalled()
	})
})
