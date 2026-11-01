/**
 * List config from a resource definition: DataTable columns and filters.
 */
import type { Snippet } from 'svelte'
import { labelText, type FilterConfig, type FilterOption } from '$lib/components/data-table/filters'
import type {
	BuiltInCellType,
	DataTableColumn,
	SortPrimitive
} from '$lib/components/data-table/types'
import { fieldFor, prop } from './fields'
import type { EnumOption, Field, FieldKind, ResourceDef, ToggleGroupDef } from './types'

const CELL_TYPES: Partial<Record<FieldKind, BuiltInCellType>> = {
	code: 'code',
	number: 'number',
	boolean: 'boolean',
	date: 'date',
	datetime: 'date'
}

/**
 * Columns in `list.columns` order. Fields drawn by a snippet
 * (`render.cell: 'snippet'`) take it from `cells`, keyed by field key:
 * snippets can only be created in components. Phase 4 replaces this with a
 * `component` cell type.
 */
export function columnsFor<Row, Full>(
	def: ResourceDef<Row, Full>,
	cells: Record<string, Snippet<[Row]>> = {}
): DataTableColumn<Row>[] {
	return def.list.columns.map((entry) =>
		typeof entry === 'string' ? fieldColumn(fieldFor(def, entry), cells) : entry
	)
}

function fieldColumn<Row, Full>(
	field: Field<Row, Full>,
	cells: Record<string, Snippet<[Row]>>
): DataTableColumn<Row> {
	const { header, type, ...options } = field.list ?? {}
	const base = { id: field.key, header: header ?? field.label, fields: [field.key] }
	const raw = (row: Row) => prop(row, field.key)

	if (field.render?.cell === 'snippet') {
		const cell = cells[field.key]
		if (!cell) throw new Error(`columnsFor: no cell snippet for "${field.key}"`)
		return { ...base, type: 'custom', cell, ...options }
	}

	if (field.kind === 'localized') {
		const { en, ja } = field.keys
		return {
			...base,
			type: 'name',
			name: (row) => ({ en: prop(row, en) as string | null, ja: prop(row, ja) as string | null }),
			sortField: en,
			fields: [en, ja],
			...options
		}
	}

	// Enums show their option label and sort by the raw value
	if (field.kind === 'enum' && !type) {
		const options_ = field.options
		return {
			...base,
			type: 'text',
			value: (row) => optionLabel(options_(), raw(row)),
			sortValue: (row) => raw(row) as SortPrimitive,
			...options
		}
	}

	return {
		...base,
		type: type ?? CELL_TYPES[field.kind] ?? 'text',
		value: raw,
		...(field.kind === 'number' ? { align: 'end' as const } : {}),
		...options
	}
}

function optionLabel(options: EnumOption[], value: unknown): string | null {
	const option = options.find((o) => o.value === value)
	return option ? labelText(option.label) : null
}

/** An enum's options as filter options (string values, as in the URL) */
function enumFilterOptions<Row, Full>(field: Field<Row, Full>): FilterOption[] {
	if (field.kind !== 'enum' && field.kind !== 'enumList') {
		throw new Error(`filtersFor: "${field.key}" needs filter.options`)
	}
	return field.options().map((o) => ({ value: String(o.value), label: o.label }))
}

/**
 * Filters in `list.filters` order. `data` supplies what option lists need at
 * runtime (e.g. the series list), keyed by field key; it's read lazily, so a
 * query's data can be passed as a getter.
 */
export function filtersFor<Row, Full>(
	def: ResourceDef<Row, Full>,
	data: Record<string, () => unknown> = {}
): FilterConfig[] {
	return def.list.filters.map((entry): FilterConfig => {
		if (typeof entry !== 'string') return toggleGroup(def, entry)

		const field = fieldFor(def, entry)
		const filter = field.filter
		const label = filter?.label ?? field.label
		switch (filter?.kind) {
			case 'multi': {
				const options = filter.options
				return {
					kind: 'multi',
					key: field.key,
					label,
					options: options ? () => options(data[field.key]?.()) : () => enumFilterOptions(field),
					...(filter.facet !== undefined ? { facet: filter.facet } : {})
				}
			}
			case 'recent':
				return { kind: 'recent', key: field.key, label, presets: filter.presets }
			default:
				throw new Error(`filtersFor: "${field.key}" has no multi or recent filter`)
		}
	})
}

function toggleGroup<Row, Full>(def: ResourceDef<Row, Full>, group: ToggleGroupDef): FilterConfig {
	return {
		kind: 'toggles',
		id: group.id,
		label: group.label,
		toggles: group.toggles.map((toggle) => {
			if (typeof toggle !== 'string') return toggle
			const field = fieldFor(def, toggle)
			if (field.kind !== 'boolean') throw new Error(`filtersFor: "${toggle}" isn't a boolean`)
			return {
				key: field.key,
				label: field.filter?.kind === 'toggle' ? field.filter.label : field.label
			}
		})
	}
}
