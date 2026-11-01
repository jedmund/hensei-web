import { describe, it, expect, beforeEach } from 'vitest'
import {
	columnsStorageKey,
	loadColumnVisibility,
	loadRowHeight,
	saveColumnVisibility,
	saveRowHeight
} from './preferences'
import type { DataTableColumn } from './types'

type Row = { id: string }

const columns: DataTableColumn<Row>[] = [
	{ id: 'name', header: 'Name', type: 'text', primary: true },
	{ id: 'element', header: 'Element', type: 'element' },
	{ id: 'slug', header: 'Slug', type: 'code', defaultHidden: true }
]

function memoryStorage() {
	const map = new Map<string, string>()
	return {
		getItem: (key: string) => map.get(key) ?? null,
		setItem: (key: string, value: string) => void map.set(key, value),
		removeItem: (key: string) => void map.delete(key),
		map
	}
}

describe('column visibility', () => {
	let store: ReturnType<typeof memoryStorage>
	beforeEach(() => {
		store = memoryStorage()
	})

	it('starts from column defaults', () => {
		expect(loadColumnVisibility('weapons', columns, store)).toEqual({
			name: true,
			element: true,
			slug: false
		})
	})

	it('saves every column in the existing grid format and reads it back', () => {
		saveColumnVisibility('weapons', columns, { name: true, element: false, slug: true }, store)
		expect(JSON.parse(store.map.get(columnsStorageKey('weapons'))!)).toEqual({
			name: true,
			element: false,
			slug: true
		})
		expect(loadColumnVisibility('weapons', columns, store)).toEqual({
			name: true,
			element: false,
			slug: true
		})
	})

	it('clears the entry when visibility is back to defaults', () => {
		saveColumnVisibility('weapons', columns, { element: false }, store)
		saveColumnVisibility('weapons', columns, { name: true, element: true, slug: false }, store)
		expect(store.map.has(columnsStorageKey('weapons'))).toBe(false)
	})

	it('never hides the primary column and ignores the legacy all-true format', () => {
		store.setItem(columnsStorageKey('weapons'), JSON.stringify({ name: false, element: false }))
		expect(loadColumnVisibility('weapons', columns, store).name).toBe(true)
		store.setItem(columnsStorageKey('weapons'), JSON.stringify({ element: true }))
		expect(loadColumnVisibility('weapons', columns, store).element).toBe(true)
		store.setItem(columnsStorageKey('weapons'), 'not json')
		expect(loadColumnVisibility('weapons', columns, store).slug).toBe(false)
	})
})

describe('column visibility: showing a hidden-by-default column', () => {
	it('survives a reload even though every column is now visible', () => {
		const store = memoryStorage()
		saveColumnVisibility('weapons', columns, { name: true, element: true, slug: true }, store)
		expect(loadColumnVisibility('weapons', columns, store).slug).toBe(true)
	})
})

describe('row height', () => {
	it('round-trips presets and rejects unknown values', () => {
		const store = memoryStorage()
		expect(loadRowHeight('weapons', 'default', store)).toBe('default')
		saveRowHeight('weapons', 'image', store)
		expect(loadRowHeight('weapons', 'default', store)).toBe('image')
		store.setItem('database-row-height-weapons', 'huge')
		expect(loadRowHeight('weapons', 'compact', store)).toBe('compact')
	})
})
