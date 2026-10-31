/**
 * Per-resource table preferences in localStorage. Column visibility uses
 * the same key and format as the wx-svelte-grid database grid
 * (`database-columns-<resource>` → `{ [columnId]: visible }`), so users keep
 * their columns when a list moves to DataTable.
 */
import { ROW_HEIGHTS, type DataTableColumn, type RowHeight } from './types'

type Visibility = Record<string, boolean>

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export const columnsStorageKey = (resource: string) => `database-columns-${resource}`
export const rowHeightStorageKey = (resource: string) => `database-row-height-${resource}`

function storage(): StorageLike | null {
	return typeof window === 'undefined' ? null : window.localStorage
}

export function canHide<T>(column: DataTableColumn<T>): boolean {
	return !column.primary && column.hideable !== false
}

export function defaultVisibility<T>(columns: DataTableColumn<T>[]): Visibility {
	const visibility: Visibility = {}
	for (const column of columns) visibility[column.id] = !column.defaultHidden
	return visibility
}

export function loadColumnVisibility<T>(
	resource: string,
	columns: DataTableColumn<T>[],
	store: StorageLike | null = storage()
): Visibility {
	const visibility = defaultVisibility(columns)
	const raw = store?.getItem(columnsStorageKey(resource))
	if (!raw) return visibility
	try {
		const saved = JSON.parse(raw) as unknown
		if (!saved || typeof saved !== 'object') return visibility
		const entries = Object.entries(saved as Record<string, unknown>)
		// The old grid's first format stored only hidden ids as `true`; it can't be read reliably
		if (!entries.some(([, value]) => value === false)) return visibility
		for (const column of columns) {
			const value = (saved as Record<string, unknown>)[column.id]
			if (typeof value === 'boolean' && canHide(column)) visibility[column.id] = value
		}
	} catch {
		// Corrupt entry: fall back to defaults
	}
	return visibility
}

export function saveColumnVisibility<T>(
	resource: string,
	columns: DataTableColumn<T>[],
	visibility: Visibility,
	store: StorageLike | null = storage()
): void {
	if (!store) return
	const defaults = defaultVisibility(columns)
	const isDefault = columns.every(
		(column) => (visibility[column.id] ?? true) === defaults[column.id]
	)
	if (isDefault) {
		store.removeItem(columnsStorageKey(resource))
		return
	}
	const saved: Visibility = {}
	for (const column of columns) saved[column.id] = visibility[column.id] ?? true
	store.setItem(columnsStorageKey(resource), JSON.stringify(saved))
}

export function loadRowHeight(
	resource: string,
	fallback: RowHeight,
	store: StorageLike | null = storage()
): RowHeight {
	const raw = store?.getItem(rowHeightStorageKey(resource))
	return raw && raw in ROW_HEIGHTS ? (raw as RowHeight) : fallback
}

export function saveRowHeight(
	resource: string,
	value: RowHeight,
	store: StorageLike | null = storage()
): void {
	store?.setItem(rowHeightStorageKey(resource), value)
}
