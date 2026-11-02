import { describe, expect, it } from 'vitest'
import { ResultSet, type ResultItem } from '../resultSet.svelte'
import {
	parseRecordId,
	preserveParams,
	readEdit,
	readOpen,
	recordId,
	recordPath,
	withClosedPanel,
	withEdit,
	withOpen
} from './panelUrl'
import { panelPosition, stepRecord } from './panelNavigation'
import { isTextField, panelKeyAction } from './panelKeys'
import { opensInPanel } from './openInPanel'

describe('panel URL state', () => {
	const base = new URL('https://granblue.team/database/weapons?view=weapons&element=fire&page=2')

	it('reads ?open=', () => {
		expect(readOpen(base)).toBeNull()
		expect(readOpen(new URL('https://x.test/a?open=1040'))).toBe('1040')
		expect(readOpen(new URL('https://x.test/a?open='))).toBeNull()
	})

	it('sets ?open= and keeps the list params', () => {
		const opened = withOpen(base, '1040001000')
		expect(opened.searchParams.get('open')).toBe('1040001000')
		expect(opened.searchParams.get('view')).toBe('weapons')
		expect(opened.searchParams.get('element')).toBe('fire')
		expect(opened.searchParams.get('page')).toBe('2')
		expect(opened.pathname).toBe('/database/weapons')
		// Input is not mutated
		expect(readOpen(base)).toBeNull()
	})

	it('replaces and removes ?open= without touching the rest', () => {
		const opened = withOpen(base, 'a')
		const replaced = withOpen(opened, 'b')
		expect(replaced.searchParams.getAll('open')).toEqual(['b'])
		const closed = withOpen(replaced, null)
		expect(closed.searchParams.has('open')).toBe(false)
		expect(closed.search).toBe(base.search)
	})

	it('reads and sets ?edit=1 next to ?open=, keeping the list params', () => {
		const opened = withOpen(base, '1040001000')
		expect(readEdit(opened)).toBe(false)
		const editing = withEdit(opened, true)
		expect(readEdit(editing)).toBe(true)
		expect(editing.searchParams.get('open')).toBe('1040001000')
		expect(editing.searchParams.get('element')).toBe('fire')
		expect(readEdit(new URL('https://x.test/a?open=1&edit=yes'))).toBe(false)
		expect(withEdit(editing, false).search).toBe(opened.search)
	})

	it('closes the panel by dropping both ?open= and ?edit=', () => {
		const editing = withEdit(withOpen(base, '1040001000'), true)
		expect(withClosedPanel(editing).search).toBe(base.search)
	})

	it('carries open and view across a list URL rebuild', () => {
		const current = new URL('https://granblue.team/database/weapons?view=weapons&page=1&open=1040')
		expect(preserveParams('/database/weapons?page=2', current, ['open', 'view'])).toBe(
			'/database/weapons?page=2&open=1040&view=weapons'
		)
		// The rebuilt URL wins when it sets the key itself
		expect(preserveParams('/database/weapons?view=series', current, ['view'])).toBe(
			'/database/weapons?view=series'
		)
		expect(preserveParams('/database/weapons', new URL('https://x.test/'), ['open'])).toBe(
			'/database/weapons'
		)
	})

	it('maps ids to full-page paths, including style swaps', () => {
		expect(recordPath('weapons', '1040001000')).toBe('/database/weapons/1040001000')
		expect(recordId('3040001000', true)).toBe('3040001000-style')
		expect(parseRecordId('characters', '3040001000-style')).toEqual({
			routeId: '3040001000',
			styleSwap: true
		})
		expect(recordPath('characters', '3040001000-style')).toBe(
			'/database/characters/3040001000/style'
		)
		expect(recordPath('characters', '3040001000')).toBe('/database/characters/3040001000')
	})

	it('reads the style suffix on character ids only, so slugs pass through', () => {
		expect(parseRecordId('summons', 'new-style')).toEqual({
			routeId: 'new-style',
			styleSwap: false
		})
		expect(recordPath('summons', 'new-style')).toBe('/database/summons/new-style')
	})
})

/** A ResultSet over `pages` pages of `perPage` ids each ("p1-1", "p1-2", …). */
function pagedResultSet(pages: number, perPage: number, start = 1) {
	const resultSet = new ResultSet()
	const pageItems = (page: number): ResultItem[] =>
		Array.from({ length: perPage }, (_, i) => ({
			id: `p${page}-${i + 1}`,
			href: `/database/weapons/p${page}-${i + 1}`
		}))
	const loads: number[] = []
	resultSet.items = pageItems(start)
	resultSet.page = start
	resultSet.totalPages = pages
	resultSet.loadPage = async (page) => {
		loads.push(page)
		resultSet.items = pageItems(page)
		resultSet.page = page
	}
	return { resultSet, loads }
}

describe('panel navigation', () => {
	it('steps within a page', async () => {
		const { resultSet, loads } = pagedResultSet(3, 3)
		expect((await stepRecord(resultSet, 'p1-1', 'next'))?.id).toBe('p1-2')
		expect((await stepRecord(resultSet, 'p1-2', 'prev'))?.id).toBe('p1-1')
		expect(loads).toEqual([])
	})

	it('crosses into the next and previous pages', async () => {
		const { resultSet, loads } = pagedResultSet(3, 3)
		const next = await stepRecord(resultSet, 'p1-3', 'next')
		expect(next?.id).toBe('p2-1')
		expect(resultSet.page).toBe(2)

		const back = await stepRecord(resultSet, 'p2-1', 'prev')
		expect(back?.id).toBe('p1-3')
		expect(resultSet.page).toBe(1)
		expect(loads).toEqual([2, 1])
	})

	it('stops at the ends of the results', async () => {
		const { resultSet, loads } = pagedResultSet(2, 2)
		expect(await stepRecord(resultSet, 'p1-1', 'prev')).toBeNull()
		await stepRecord(resultSet, 'p1-2', 'next')
		expect(await stepRecord(resultSet, 'p2-2', 'next')).toBeNull()
		expect(loads).toEqual([2])
	})

	it('stops when a page load fails to move the list', async () => {
		const { resultSet } = pagedResultSet(3, 2)
		resultSet.loadPage = async () => {}
		expect(await stepRecord(resultSet, 'p1-2', 'next')).toBeNull()
	})

	it('does not cross pages for a static list', async () => {
		const { resultSet } = pagedResultSet(3, 2)
		resultSet.loadPage = null
		expect(await stepRecord(resultSet, 'p1-2', 'next')).toBeNull()
	})

	it('enters the loaded page when the open record is not on it', async () => {
		const { resultSet } = pagedResultSet(3, 3, 2)
		expect((await stepRecord(resultSet, 'elsewhere', 'next'))?.id).toBe('p2-1')
		expect((await stepRecord(resultSet, 'elsewhere', 'prev'))?.id).toBe('p2-3')
	})

	it('reports position and whether each direction is available', () => {
		const { resultSet } = pagedResultSet(3, 4, 2)
		expect(panelPosition(resultSet, 'p2-3')).toEqual({
			index: 3,
			count: 4,
			page: 2,
			totalPages: 3,
			hasPrev: true,
			hasNext: true
		})

		const first = pagedResultSet(1, 2).resultSet
		expect(panelPosition(first, 'p1-1')).toMatchObject({ hasPrev: false, hasNext: true })
		expect(panelPosition(first, 'p1-2')).toMatchObject({ hasPrev: true, hasNext: false })
		expect(panelPosition(first, 'missing')).toMatchObject({ index: null })
	})
})

function key(key: string, init: Partial<KeyboardEvent> & { target?: EventTarget | null } = {}) {
	return {
		key,
		target: null,
		metaKey: false,
		ctrlKey: false,
		altKey: false,
		shiftKey: false,
		defaultPrevented: false,
		isComposing: false,
		...init
	}
}

describe('panel keys', () => {
	const outside = { focusInPanel: false }
	const inside = { focusInPanel: true }

	it('maps j/k, Esc and e', () => {
		expect(panelKeyAction(key('j'), outside)).toBe('next')
		expect(panelKeyAction(key('k'), outside)).toBe('prev')
		expect(panelKeyAction(key('Escape'), outside)).toBe('close')
		expect(panelKeyAction(key('e'), outside)).toBe('edit')
		expect(panelKeyAction(key('x'), outside)).toBeNull()
	})

	it('steps with arrows only when focus is in the panel', () => {
		expect(panelKeyAction(key('ArrowDown'), outside)).toBeNull()
		expect(panelKeyAction(key('ArrowDown'), inside)).toBe('next')
		expect(panelKeyAction(key('ArrowUp'), inside)).toBe('prev')
	})

	it('ignores modified and already-handled keys', () => {
		expect(panelKeyAction(key('j', { metaKey: true }), outside)).toBeNull()
		expect(panelKeyAction(key('k', { ctrlKey: true }), outside)).toBeNull()
		expect(panelKeyAction(key('e', { altKey: true }), outside)).toBeNull()
		expect(panelKeyAction(key('J', { shiftKey: true }), outside)).toBeNull()
		expect(panelKeyAction(key('j', { defaultPrevented: true }), outside)).toBeNull()
		expect(panelKeyAction(key('j', { isComposing: true }), outside)).toBeNull()
	})

	it('skips text fields', () => {
		const input = document.createElement('input')
		const textarea = document.createElement('textarea')
		const select = document.createElement('select')
		const editable = document.createElement('div')
		editable.setAttribute('contenteditable', 'true')
		const child = document.createElement('span')
		editable.appendChild(child)

		for (const target of [input, textarea, select, child]) {
			expect(panelKeyAction(key('j', { target }), inside)).toBeNull()
			expect(panelKeyAction(key('ArrowDown', { target }), inside)).toBeNull()
			expect(panelKeyAction(key('Escape', { target }), inside)).toBeNull()
		}
	})

	describe('while editing', () => {
		const editing = { focusInPanel: true, editing: true }
		const input = () => document.createElement('input')

		it('saves with ⌘S or ctrl+S, from text fields too', () => {
			expect(panelKeyAction(key('s', { metaKey: true }), editing)).toBe('save')
			expect(panelKeyAction(key('s', { ctrlKey: true, target: input() }), editing)).toBe('save')
			expect(panelKeyAction(key('S', { metaKey: true, shiftKey: true }), editing)).toBe('save')
			expect(panelKeyAction(key('s', { metaKey: true, altKey: true }), editing)).toBeNull()
			// Not editing: ⌘S stays the browser's
			expect(panelKeyAction(key('s', { metaKey: true }), inside)).toBeNull()
		})

		it('stops editing with Esc, from text fields too, instead of closing', () => {
			expect(panelKeyAction(key('Escape'), editing)).toBe('cancel')
			expect(panelKeyAction(key('Escape', { target: input() }), editing)).toBe('cancel')
		})

		it('ignores e, and keeps j/k out of text fields', () => {
			expect(panelKeyAction(key('e'), editing)).toBeNull()
			expect(panelKeyAction(key('j'), editing)).toBe('next')
			expect(panelKeyAction(key('j', { target: input() }), editing)).toBeNull()
		})
	})

	it('still handles keys on buttons and checkboxes', () => {
		const button = document.createElement('button')
		const checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		expect(isTextField(button)).toBe(false)
		expect(isTextField(checkbox)).toBe(false)
		expect(panelKeyAction(key('j', { target: button }), inside)).toBe('next')
	})
})

describe('opening from a list row', () => {
	const click = (init: Partial<MouseEvent> = {}) => ({
		button: 0,
		metaKey: false,
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
		...init
	})

	it('opens plain clicks in the panel on wide screens', () => {
		expect(opensInPanel(click(), true)).toBe(true)
		expect(opensInPanel(null, true)).toBe(true)
	})

	it('leaves modified and middle clicks to the browser', () => {
		expect(opensInPanel(click({ metaKey: true }), true)).toBe(false)
		expect(opensInPanel(click({ ctrlKey: true }), true)).toBe(false)
		expect(opensInPanel(click({ shiftKey: true }), true)).toBe(false)
		expect(opensInPanel(click({ button: 1 }), true)).toBe(false)
	})

	it('opens the full page on phones', () => {
		expect(opensInPanel(click(), false)).toBe(false)
	})
})
