import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/weapons/1030102700'),
	params: { resource: 'weapons', id: '1030102700' } as Record<string, string>,
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
vi.mock('$app/navigation', () => ({ goto: vi.fn(async () => {}) }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

// One client for the whole file, in place of the app layout's provider
const queries = vi.hoisted(() => ({ clear: () => {} }))
vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const client = new actual.QueryClient({ defaultOptions: { queries: { retry: false } } })
	queries.clear = () => client.clear()
	return {
		...actual,
		useQueryClient: () => client,
		createQuery: ((options: never) =>
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

import { weaponAdapter, type Weapon } from '$lib/api/adapters/weapon.adapter'
import { weaponsResource } from '$lib/features/database/weapons/resource'
import { detailRecords } from '$lib/features/database/weapons/__fixtures__/detailRecords'
import baseline from '$lib/features/database/weapons/__fixtures__/detail-baseline.json'
import ResourceDetail from './ResourceDetail.svelte'
import ResourceDetailScreen from './ResourceDetailScreen.svelte'

/** Visible text, one line per text node, as the baseline's innerText split it */
function lines(el: Element | null): string[] {
	if (!el) return []
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
	const out: string[] = []
	while (walker.nextNode()) {
		const text = walker.currentNode.textContent?.replace(/\s+/g, ' ').trim()
		if (text) out.push(text)
	}
	return out
}

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

function render(
	name: keyof typeof detailRecords,
	props: { role?: number; tab?: string; record?: Partial<Weapon> } = {}
) {
	target = document.createElement('div')
	document.body.appendChild(target)
	const record = { ...detailRecords[name], ...props.record }
	mounted = mount(ResourceDetail, {
		target,
		props: {
			def: weaponsResource,
			granblueId: record.granblueId,
			initialData: record,
			role: props.role ?? 7,
			tab: props.tab ?? null,
			onTabChange: () => {}
		}
	})
	flushSync()
}

const tabLabels = () =>
	[...target.querySelectorAll('[role="radio"], button')].map((b) => b.textContent?.trim())

/**
 * The baseline as the generated detail draws it on purpose: empty link rows
 * are hidden rather than showing a dash, and with none left the Links
 * section goes too. Links is the last section.
 */
function expectedInfo(name: keyof typeof baseline): string[] {
	// The definition labels the GameWith link with the site's own spelling
	const info = baseline[name].info.map((l) => (l === 'Gamewith' ? 'GameWith' : l))
	const at = info.indexOf('Links')
	// Label and value pairs, kept unless the value is a dash
	const links = info.slice(at + 1).filter((l, i, rest) => rest[i - (i % 2) + 1] !== '—')
	return [...info.slice(0, at), ...(links.length ? ['Links', ...links] : [])]
}

afterEach(() => {
	vi.restoreAllMocks()
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

describe('ResourceDetail: the Info tab matches the hand-written detail', () => {
	for (const name of Object.keys(baseline) as Array<keyof typeof baseline>) {
		it(name, () => {
			render(name)
			expect(lines(target.querySelector('.details'))).toEqual(expectedInfo(name))
		})
	}

	it('draws the uncap stars, element and proficiency labels', () => {
		render('awake')
		const items = [...target.querySelectorAll('.detail-item')]
		const item = (label: string) =>
			items.find((i) => i.querySelector('.label')?.textContent === label)
		// ULB: three base stars plus FLB and ULB
		expect(item('Uncap')?.querySelectorAll('.star')).toHaveLength(5)
		expect(item('Element')?.querySelector('img')).not.toBeNull()
		expect(item('Proficiency')?.querySelector('img')).not.toBeNull()
	})

	it('links the recruited character and opens links in a new tab', () => {
		render('sparse')
		expect(target.querySelector('a[href*="/database/characters/3030158000"]')).not.toBeNull()
		const open = target.querySelector<HTMLAnchorElement>('a[target="_blank"]')
		expect(open?.href).toContain('Kilij')
	})
})

describe('ResourceDetail: links', () => {
	it('hides empty link rows', () => {
		render('plain')
		const info = lines(target.querySelector('.details'))
		expect(info.slice(info.indexOf('Links'))).toEqual(['Links', 'Wiki (EN)', 'Open'])
	})

	it('drops the Links section when every link is empty', () => {
		render('plain', { record: { wiki: {} } })
		expect(lines(target.querySelector('.details'))).not.toContain('Links')
	})
})

describe('ResourceDetail: tabs', () => {
	it('always shows Skills, and Raw Data only to editors', () => {
		render('plain')
		expect(tabLabels()).toEqual(expect.arrayContaining(['Info', 'Skills', 'Images', 'Raw Data']))
		unmount(mounted!)
		mounted = null

		render('plain', { role: 1 })
		expect(tabLabels()).not.toContain('Raw Data')
	})

	it('falls back to Info for a tab the record lacks', () => {
		render('plain', { role: 1, tab: 'raw' })
		expect(target.querySelector('.details')).not.toBeNull()
	})

	it('renders the requested tab', () => {
		render('plain', { tab: 'images' })
		expect(target.querySelector('.details')).toBeNull()
		expect(target.querySelectorAll('img').length).toBeGreaterThan(1)
	})
})

describe('ResourceDetail: Skills empty states', () => {
	const buildButton = () =>
		[...target.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Build skills')

	it('offers editors a build when the skills were never built', () => {
		render('plain', { tab: 'skills' })
		expect(target.textContent).toContain("Skills haven't been built for this weapon yet.")
		expect(buildButton()).toBeDefined()
	})

	it('shows non-editors the message without the build', () => {
		render('plain', { role: 1, tab: 'skills' })
		expect(target.textContent).toContain("Skills haven't been built for this weapon yet.")
		expect(buildButton()).toBeUndefined()
	})

	it('says there are none once built', () => {
		render('plain', { tab: 'skills', record: { skillsBuiltAt: '2026-11-01T00:00:00Z' } })
		expect(target.textContent).toContain('This weapon has no skills.')
		expect(buildButton()).toBeUndefined()
	})

	it('builds through the re-parse', async () => {
		const reparse = vi
			.spyOn(weaponAdapter, 'reparseWeapon')
			.mockResolvedValue(detailRecords.plain as Weapon)
		render('plain', { tab: 'skills' })
		buildButton()!.click()
		await vi.waitFor(() => expect(reparse).toHaveBeenCalledWith('w-plain', true))
	})
})

describe('ResourceDetailScreen', () => {
	it('puts Back, the noun and Edit above the detail', () => {
		target = document.createElement('div')
		document.body.appendChild(target)
		mounted = mount(ResourceDetailScreen, {
			target,
			props: { data: { record: detailRecords.plain, role: 7, resource: 'weapons' } }
		})
		flushSync()
		expect(lines(target).slice(0, 4)).toEqual(['Back', 'Weapon', 'Edit', 'Sunset Dagger'])
		expect(target.querySelector('a[href$="/database/weapons/1030102700/edit"]')).not.toBeNull()
	})
})
