import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushSync, mount, unmount, tick } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/character-roles'),
	state: {},
	data: {}
}))

// jsdom has no matchMedia or scrollIntoView
vi.hoisted(() => {
	Element.prototype.scrollIntoView ??= () => {}
	window.matchMedia ??= ((query: string) => ({
		matches: true,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	})) as unknown as typeof window.matchMedia
})

vi.mock('$app/state', () => ({ page: pageState }))
const goto = vi.hoisted(() => vi.fn(async () => {}))
vi.mock('$app/navigation', () => ({ goto }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))
const toastError = vi.hoisted(() => vi.fn())
vi.mock('svelte-sonner', () => ({ toast: { error: toastError, success: vi.fn() } }))

// The panel has its own tests; this stand-in reads the ResultSet it would step through
const panel = vi.hoisted(() => ({ resultSet: null as { items: { id: string }[] } | null }))
vi.mock('$lib/features/database/panel/RecordPanel.svelte', async () => {
	const { getResultSet } = await import('$lib/features/database/resultSet.svelte')
	return {
		default: () => {
			panel.resultSet = getResultSet() ?? null
		}
	}
})

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

import { adminAdapter } from '$lib/api/adapters/admin.adapter'
import { characterRolesResource } from '$lib/features/database/character-roles/resource'
import type { AdminCharacterRoleRow, AdminListParams } from '$lib/types/api/admin'
import OrderedList from './OrderedList.svelte'

const role = (id: string, nameEn: string, sortOrder: number, nameJp: string | null = null) =>
	({ id, nameEn, nameJp, sortOrder, iconKey: null }) as AdminCharacterRoleRow

const ROWS = [
	role('a', 'Attacker', 1, 'アタッカー'),
	role('d', 'Defender', 2),
	role('h', 'Healer', 3)
]

const ordered = characterRolesResource.list.ordered!
let list: ReturnType<typeof vi.spyOn>
let reorder: ReturnType<typeof vi.fn<(rows: AdminCharacterRoleRow[]) => Promise<void>>>
const originalReorder = ordered.reorder

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

async function render() {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(OrderedList, { target, props: { resource: 'character-roles' } })
	await vi.waitFor(() => expect(target.querySelectorAll('.row')).toHaveLength(ROWS.length))
	flushSync()
}

const titles = () => [...target.querySelectorAll('.row .title')].map((el) => el.textContent)
const grip = (i: number) => target.querySelectorAll<HTMLButtonElement>('.grip')[i]!
const press = (el: Element, key: string, init: KeyboardEventInit = {}) => {
	el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
	flushSync()
}

// What the server holds: a reorder saves it, the next list returns it
let stored: AdminCharacterRoleRow[] = ROWS

beforeEach(() => {
	stored = ROWS
	list = vi.spyOn(adminAdapter, 'list').mockImplementation(async () => ({
		results: stored,
		meta: { total: stored.length, page: 1, per: 200, totalPages: 1 },
		facets: {}
	}))
	reorder = vi.fn<(rows: AdminCharacterRoleRow[]) => Promise<void>>(async (rows) => {
		stored = rows
	})
	ordered.reorder = reorder
})

afterEach(() => {
	vi.restoreAllMocks()
	ordered.reorder = originalReorder
	delete ordered.inactive
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
	toastError.mockReset()
})

describe('OrderedList', () => {
	it('requests every row once, in stored order, with the base fields', async () => {
		await render()
		expect(list).toHaveBeenCalledWith('character-roles', {
			page: 1,
			per: 200,
			sort: 'sort_order,name_en',
			fields: ['icon_key', 'name_en', 'name_jp', 'sort_order']
		} satisfies AdminListParams)
		expect(titles()).toEqual(['Attacker', 'Defender', 'Healer'])
		expect(target.querySelector('.row .subtitle')?.textContent).toBe('アタッカー')
		expect(target.querySelector('.row-link')?.getAttribute('href')).toBe(
			'/database/character-roles/a'
		)
	})

	it('hands the panel the rows in display order', async () => {
		await render()
		expect(panel.resultSet?.items.map((i) => i.id)).toEqual(['a', 'd', 'h'])
	})

	it('picks a row up with Space, moves it with the arrows, and saves on drop', async () => {
		await render()
		press(grip(0), ' ')
		expect(grip(0).getAttribute('aria-pressed')).toBe('true')
		press(grip(0), 'ArrowDown')
		press(grip(1), 'ArrowDown')
		expect(titles()).toEqual(['Defender', 'Healer', 'Attacker'])
		expect(reorder).not.toHaveBeenCalled()
		expect(target.querySelector('[aria-live]')?.textContent).toContain('position 3 of 3')

		press(grip(2), ' ')
		await vi.waitFor(() => expect(reorder).toHaveBeenCalledTimes(1))
		expect(reorder.mock.calls[0]![0].map((r: AdminCharacterRoleRow) => r.id)).toEqual([
			'd',
			'h',
			'a'
		])
		await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(2))
		await tick()
		expect(titles()).toEqual(['Defender', 'Healer', 'Attacker'])
		expect(document.activeElement).toBe(grip(2))
	})

	it('cancels a keyboard move with Escape', async () => {
		await render()
		press(grip(1), 'Enter')
		press(grip(1), 'ArrowUp')
		expect(titles()).toEqual(['Defender', 'Attacker', 'Healer'])
		press(grip(0), 'Escape')
		expect(titles()).toEqual(['Attacker', 'Defender', 'Healer'])
		expect(reorder).not.toHaveBeenCalled()
	})

	it('moves a focused row with Alt+arrow and steps focus with the arrows', async () => {
		await render()
		const links = () => target.querySelectorAll<HTMLAnchorElement>('.row-link')
		press(links()[0]!, 'ArrowDown')
		await tick()
		expect(document.activeElement).toBe(links()[1])
		press(links()[1]!, 'ArrowUp', { altKey: true })
		expect(titles()).toEqual(['Defender', 'Attacker', 'Healer'])
		await vi.waitFor(() => expect(reorder).toHaveBeenCalledTimes(1))
	})

	it('saves a drag and drop', async () => {
		await render()
		const rows = target.querySelectorAll('.row')
		rows[2]!.dispatchEvent(new Event('dragstart', { bubbles: true }))
		rows[0]!.dispatchEvent(new Event('dragover', { bubbles: true, cancelable: true }))
		rows[0]!.dispatchEvent(new Event('drop', { bubbles: true, cancelable: true }))
		flushSync()
		expect(titles()).toEqual(['Healer', 'Attacker', 'Defender'])
		await vi.waitFor(() => expect(reorder).toHaveBeenCalledTimes(1))
	})

	it('puts the saved order back and says so when saving fails', async () => {
		reorder.mockRejectedValueOnce({ status: 422, message: 'nope' })
		await render()
		press(grip(0), 'ArrowDown', { altKey: true })
		expect(titles()).toEqual(['Defender', 'Attacker', 'Healer'])
		await vi.waitFor(() => expect(toastError).toHaveBeenCalled())
		await vi.waitFor(() => expect(titles()).toEqual(['Attacker', 'Defender', 'Healer']))
	})

	it('dims inactive rows with a badge', async () => {
		ordered.inactive = (r) => r.id === 'h'
		await render()
		const rows = target.querySelectorAll('.row')
		expect(rows[2]!.classList.contains('inactive')).toBe(true)
		expect(rows[2]!.querySelector('.badge')?.textContent).toBe('Inactive')
		expect(rows[0]!.classList.contains('inactive')).toBe(false)
	})

	it('shows the empty message when there are no rows', async () => {
		stored = []
		target = document.createElement('div')
		document.body.appendChild(target)
		mounted = mount(OrderedList, { target, props: { resource: 'character-roles' } })
		await vi.waitFor(() => expect(target.querySelector('.empty-state')).not.toBeNull())
		expect(target.textContent).toContain(characterRolesResource.list.empty())
	})
})
