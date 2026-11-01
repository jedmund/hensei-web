import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { flushSync, mount, unmount, type ComponentProps } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/weapons?view=series')
}))
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the signature types mock.calls
const goto = vi.hoisted(() => vi.fn(async (_href: string, _options?: unknown) => {}))

// jsdom has no ResizeObserver (bind:clientHeight and the virtualizer use it)
globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof ResizeObserver

vi.mock('$app/state', () => ({ page: pageState }))
vi.mock('$app/navigation', () => ({ goto }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

import DataTable from './DataTable.svelte'
import { createStaticSource } from './staticSource.svelte'
import { TableUrl } from './tableUrl.svelte'
import { ResultSet } from '$lib/features/database/resultSet.svelte'
import type { DataTableColumn } from './types'

interface Series {
	id: string
	slug: string
	order: number
	name: { en: string; ja: string }
}

const data: Series[] = [
	{ id: 's2', slug: 'ultima', order: 2, name: { en: 'Ultima', ja: 'オメガ' } },
	{ id: 's1', slug: 'dark-opus', order: 1, name: { en: 'Dark Opus', ja: 'ダーク・オーパス' } }
]

const columns: DataTableColumn<Series>[] = [
	{ id: 'order', header: 'Order', type: 'number', value: (s) => s.order },
	{ id: 'name', header: 'Name', type: 'name', name: (s) => s.name, primary: true },
	{ id: 'slug', header: 'Slug', type: 'code', value: (s) => s.slug }
]

let component: ReturnType<typeof mount> | undefined

function render(
	rows: Series[] | undefined,
	extra: Record<string, unknown> = {},
	options: { pending?: boolean } = {}
) {
	const url = new TableUrl({ defaultSort: [{ id: 'order', desc: false }] })
	const source = createStaticSource({
		url,
		columns,
		data: () => rows,
		isPending: () => options.pending ?? false
	})
	component = mount(DataTable, {
		target: document.body,
		// Mounting a generic component infers T = object; the props are typed by Series above
		props: {
			columns,
			source,
			rowId: (s: Series) => s.id,
			rowHref: (s: Series) => `/database/series/weapons/${s.slug}`,
			rowTitle: (s: Series) => s.name.en,
			storageKey: 'test-series',
			label: 'Weapon series',
			...extra
		} as unknown as ComponentProps<typeof DataTable>
	})
	flushSync()
}

beforeEach(() => {
	pageState.url = new URL('http://localhost/database/weapons?view=series&open=s1')
	goto.mockClear()
	localStorage.clear()
})

afterEach(() => {
	if (component) unmount(component)
	component = undefined
	document.body.innerHTML = ''
})

describe('DataTable', () => {
	it('renders a real table whose rows are links, in sorted order', () => {
		render(data)
		expect(document.querySelector('table')?.getAttribute('aria-label')).toBe('Weapon series')
		const links = [...document.querySelectorAll<HTMLAnchorElement>('tbody a.row-link')]
		expect(links.map((a) => a.getAttribute('href'))).toEqual([
			'/database/series/weapons/dark-opus',
			'/database/series/weapons/ultima'
		])
		// The link is in the primary (name) cell, with the other locale beneath
		expect(links[0]?.closest('td')?.classList.contains('primary')).toBe(true)
		expect(links[0]?.textContent).toContain('ダーク・オーパス')
	})

	it('marks the sorted header and writes sort changes to the URL, keeping view and open', () => {
		render(data)
		const headers = [...document.querySelectorAll('th')]
		expect(headers[0]?.getAttribute('aria-sort')).toBe('ascending')
		expect(headers[1]?.hasAttribute('aria-sort')).toBe(false)

		headers[0]?.querySelector('button')?.click()
		expect(goto).toHaveBeenCalledTimes(1)
		const href = goto.mock.calls[0]![0]
		const params = new URL(href, 'http://localhost').searchParams
		expect(params.get('sort')).toBe('-order')
		expect(params.get('view')).toBe('series')
		expect(params.get('open')).toBe('s1')
	})

	it('lets the page intercept a row click', () => {
		const onRowActivate = vi.fn((_row: Series, event: MouseEvent) => event.preventDefault())
		render(data, { onRowActivate })
		const link = document.querySelector<HTMLAnchorElement>('tbody a.row-link')!
		const event = new MouseEvent('click', { bubbles: true, cancelable: true })
		link.dispatchEvent(event)
		expect(onRowActivate).toHaveBeenCalledTimes(1)
		// Avoid deep equality: comparing a DOM event walks into framework internals
		expect(onRowActivate.mock.calls[0]![0].id).toBe('s1')
		expect(onRowActivate.mock.calls[0]![1]).toBe(event)
		expect(event.defaultPrevented).toBe(true)
	})

	it('marks the selected row as current', () => {
		render(data, { selectedId: 's2' })
		const rows = [...document.querySelectorAll('tbody tr')]
		expect(rows.map((row) => row.getAttribute('aria-current'))).toEqual([null, 'true'])
	})

	it("colours the open row with its item's element, and leaves rows without one alone", () => {
		const elements: Record<string, number | null> = { s1: 0, s2: 6 }
		render(data, { selectedId: 's2', rowElement: (s: Series) => elements[s.id] })
		const [nullRow, darkRow] = [...document.querySelectorAll<HTMLElement>('tbody tr')]
		expect(darkRow!.getAttribute('aria-current')).toBe('true')
		expect(darkRow!.style.getPropertyValue('--row-accent')).toBe('var(--dark-button-bg)')
		expect(nullRow!.style.getPropertyValue('--row-accent')).toBe('')
		expect(nullRow!.getAttribute('style') ?? '').not.toContain('--row-accent')
	})

	it('keeps the ResultSet in display order', () => {
		const resultSet = new ResultSet()
		render(data, { resultSet })
		expect(resultSet.items).toEqual([
			{ id: 's1', href: '/database/series/weapons/dark-opus', title: 'Dark Opus' },
			{ id: 's2', href: '/database/series/weapons/ultima', title: 'Ultima' }
		])
		expect(resultSet.loadPage).toBeNull()
	})

	it('shows skeleton rows while loading', () => {
		render(undefined, {}, { pending: true })
		expect(document.querySelectorAll('tr.skeleton').length).toBeGreaterThan(0)
		expect(document.querySelector('[role="status"]')).not.toBeNull()
	})

	it('shows the empty state, and a no-match state with a clear action when searching', () => {
		render([], { emptyMessage: 'No weapon series found' })
		expect(document.querySelector('.empty-state')?.textContent).toContain('No weapon series found')
		unmount(component!)
		document.body.innerHTML = ''

		pageState.url = new URL('http://localhost/database/weapons?view=series&q=zzz')
		render(data)
		expect(document.querySelector('table')).toBeNull()
		expect(document.querySelector('.empty-state button')).not.toBeNull()
	})

	it('virtualises long static lists with spacer rows', () => {
		const many: Series[] = Array.from({ length: 300 }, (_, i) => ({
			id: `s${i}`,
			slug: `series-${i}`,
			order: i,
			name: { en: `Series ${i}`, ja: `シリーズ${i}` }
		}))
		// jsdom has no layout: give the scroll area a size so the virtualizer has a window
		const height = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(480)
		const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
		render(many)
		height.mockRestore()
		width.mockRestore()
		const rendered = document.querySelectorAll('tbody tr:not(.spacer)').length
		expect(rendered).toBeGreaterThan(0)
		expect(rendered).toBeLessThan(many.length)
		expect(document.querySelector('tr.spacer')).not.toBeNull()
		// The footer still counts every row
		expect(document.querySelector('.range')?.textContent).toContain('300')
	})

	it('hides columns turned off in the stored preferences', () => {
		localStorage.setItem('database-columns-test-series', JSON.stringify({ slug: false }))
		render(data)
		const headerText = [...document.querySelectorAll('th')].map((th) => th.textContent?.trim())
		expect(headerText).toEqual(['Order', 'Name'])
	})
})
