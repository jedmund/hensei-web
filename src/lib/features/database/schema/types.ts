/**
 * Entity schema layer (GBF-142): one description per database resource, from
 * which the list columns, filters, detail view and forms are generated.
 *
 * Three shapes of data meet here:
 * - **Row:** a flat admin list row (camelCased admin fields), read by columns.
 * - **Full:** the full record the detail and edit pages load, read through
 *   each field's `read` accessor.
 * - **Values:** form values keyed by field `key`, produced by `fromRecord`
 *   and turned into the API payload by `toPayload`.
 *
 * Field keys are the snake_case admin field and strong-param names, so one
 * key names the column, the filter, the sort and the param.
 */
import type { Component } from 'svelte'
import type { z } from 'zod'
import type { BuiltInCellType, ColumnBase, DataTableColumn } from '$lib/components/data-table/types'
import type { FilterOption, RecentPreset } from '$lib/components/data-table/filters'
import type { SortSpec } from '$lib/components/data-table/urlState'
import type { DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'

/** A Paraglide message function, so labels follow the locale */
export type Message = () => string

/** Form values keyed by field key. The registry boundary is untyped */
export type Values = Record<string, unknown>

export type FormMode = 'create' | 'edit'

/**
 * Svelte components the renderers resolve by name. Definitions are plain
 * `.ts` (snippets can't be created there) and stay importable in node tests;
 * the detail and form renderers (phases 5–6) map each name to a component.
 */
export type ComponentName =
	'uncapIndicator' | 'weaponAwakenings' | 'weaponForge' | 'elementVariantIds' | 'bulletSlots'

/**
 * How an empty value ('', null, undefined, [] or {}) is sent:
 * `keep` sends it as is, `null` sends null, `omit` leaves the param out
 * (the server keeps its current value).
 */
export type EmptyPolicy = 'keep' | 'null' | 'omit'

export interface EnumOption {
	value: number | string
	label: string | Message
}

/** Records a reference points at */
export type ReferenceResource =
	'character' | 'weapon' | 'weaponSeries' | 'weaponSeriesVariant' | 'awakening'

/** Column options. The column id is the field key, the header its label */
export type ListOptions<Row> = Partial<Omit<ColumnBase<Row>, 'id' | 'header'>> & {
	header?: Message
	/** A built-in cell type other than the kind's default (e.g. `element`) */
	type?: BuiltInCellType
}

export type FieldFilter =
	| {
			kind: 'multi'
			label?: Message
			/**
			 * Defaults to the enum's options. `data` is what the caller passes to
			 * `filtersFor` under this field's key (e.g. the series list).
			 */
			options?: (data: unknown) => FilterOption[]
			facet?: boolean
	  }
	/** A boolean in a toggle group (see `ToggleGroupDef`); only overrides the label */
	| { kind: 'toggle'; label: Message }
	| { kind: 'recent'; label?: Message; presets: RecentPreset[] }

export interface FormOptions {
	/** Shown on the create form. Defaults to true */
	create?: boolean
	/** Shown on the edit form. Defaults to true */
	edit?: boolean
	placeholder?: Message
	width?: string
}

export interface WriteOptions {
	/** Param name, when it differs from the key */
	key?: string
	/** Converts the form value before the empty policy applies */
	value?: (value: unknown, values: Values) => unknown
}

export interface FieldRender {
	/** The list cell is a snippet the caller hands to `columnsFor` under the field key */
	cell?: 'snippet'
	/** Detail display drawn by a named component */
	detail?: ComponentName
	/** Form input drawn by a named component */
	input?: ComponentName
}

interface FieldBase<Row, Full> {
	key: string
	label: Message
	/** Hint under the label, in detail and forms */
	sublabel?: Message
	/** Value from the full record. Defaults to `record[camelCase(key)]` */
	read?: (record: Full) => unknown
	/** A param rename, conversion, or `false` for read-only */
	write?: false | string | WriteOptions
	/** Defaults: `null` for dates, enums, numbers and references; `keep` otherwise */
	empty?: EmptyPolicy
	/** Initial create value, and the value when the record has none */
	default?: unknown
	required?: boolean
	list?: ListOptions<Row>
	filter?: FieldFilter
	/** `false` keeps the field off both forms */
	form?: false | FormOptions
	/** Shown, validated and sent only while this holds */
	when?: (values: Values) => boolean
	/** Extra rules the value must also pass */
	validate?: z.ZodType
	render?: FieldRender
}

export type Field<Row = unknown, Full = unknown> = FieldBase<Row, Full> &
	(
		| { kind: 'text'; maxLength?: number }
		| {
				kind: 'link'
				/** The Open button's URL */
				href: (value: string, values: Values) => string | null
		  }
		| { kind: 'code' }
		| {
				kind: 'localized'
				/** The en and ja params (and admin fields) */
				keys: { en: string; ja: string }
				/** Per-language labels for the detail rows and inputs */
				labels: { en: Message; ja: Message }
				of?: 'text' | 'tags'
		  }
		| { kind: 'number'; int?: boolean; min?: number; max?: number }
		| { kind: 'boolean' }
		| { kind: 'date' }
		| { kind: 'datetime' }
		| { kind: 'enum'; options: () => EnumOption[] }
		| {
				kind: 'enumList'
				options: () => EnumOption[]
				/** Order matters and values may repeat (e.g. bullet slots) */
				ordered?: boolean
				max?: number
		  }
		| { kind: 'tags' }
		| {
				kind: 'reference'
				resource: ReferenceResource
				/** The form value (an id) from what `read` returns. Defaults to `ref.id` */
				id?: (ref: unknown) => string | null
		  }
		| {
				kind: 'referenceList'
				resource: ReferenceResource
				id?: (ref: unknown) => string | null
		  }
		| { kind: 'custom' }
	)

export type FieldKind = Field['kind']

export interface Section {
	id: string
	title: Message
	/** Field keys in display order */
	fields: string[]
	/** Draws the whole section, owning the listed fields */
	component?: ComponentName
	when?: (values: Values) => boolean
}

/** Booleans (field keys) and API-only flags shown as one toggles menu */
export interface ToggleGroupDef {
	id: string
	label: Message
	toggles: Array<string | { key: string; label: Message }>
}

export interface ListDef<Row> {
	/** Field keys, or a literal column for things that aren't fields (the thumbnail) */
	columns: Array<string | DataTableColumn<Row>>
	/** Field keys with a `multi` or `recent` filter, or toggle groups */
	filters: Array<string | ToggleGroupDef>
	/** Fields every request asks for, whichever columns are visible */
	baseFields: string[]
	defaultSort: SortSpec[]
}

/**
 * Synchronous derived values: returns the values to change, if any.
 * `changed` is the key the user just edited, or null on load. Rules run in
 * order, each seeing the previous rules' changes.
 */
export type DeriveRule = (values: Values, changed: string | null) => Values | undefined

/** Cross-field validation; report each problem against a field key */
export type RefineRule = (values: Values, issue: (key: string, message: string) => void) => void

/** Page data the record screens (full-page detail and edit) receive */
export interface RecordScreenData<Full> {
	record: Full
	role: number
}

/** The panel body: the detail view without the page around it */
export type RecordBodyProps = {
	granblueId: string
	role: number
	/** Requested detail tab (local state in the panel) */
	tab: string | null
	onTabChange: (tab: DetailTab) => void
}

/** A screen component, imported only when its route or panel opens */
type Lazy<Props extends Record<string, unknown>> = () => Promise<{ default: Component<Props> }>

/**
 * Hand-written screens that replace the generated ones. Until the generated
 * screens land (phases 4–7) a registered resource renders only these; the
 * generic routes 404 a screen the resource doesn't have.
 */
export interface Screens<Full> {
	/** The list takes no props: it reads its state from the URL */
	list?: Lazy<Record<string, never>>
	detail?: Lazy<{ data: RecordScreenData<Full> }>
	edit?: Lazy<{ data: RecordScreenData<Full> }>
	new?: Lazy<Record<string, never>>
	/** The record side panel's body */
	panel?: Lazy<RecordBodyProps>
}

export type ScreenKind = keyof Screens<unknown>

/** The component a screen kind resolves to */
export type ScreenComponent<K extends ScreenKind, Full = unknown> = Awaited<
	ReturnType<NonNullable<Screens<Full>[K]>>
>['default']

export interface RecordDef<Full> {
	/**
	 * The full record the detail and edit pages load, by route id. Rejects with
	 * an error carrying `status: 404` when there's no such record. Import the
	 * adapter lazily: the param matcher puts the registry in the app's entry.
	 */
	fetch: (id: string) => Promise<Full>
}

export interface ResourceDef<Row = unknown, Full = unknown> {
	/** Route segment and admin resource, e.g. `weapons` */
	name: string
	fields: Field<Row, Full>[]
	list: ListDef<Row>
	layout: {
		detail: Section[]
		/** Defaults to `detail` */
		edit?: Section[]
		/** Defaults to `edit` */
		create?: Section[]
	}
	derive?: DeriveRule[]
	refine?: RefineRule
	record?: RecordDef<Full>
	screens?: Screens<Full>
}

/** Keeps the row and record types on a definition */
export function defineResource<Row, Full>(def: ResourceDef<Row, Full>): ResourceDef<Row, Full> {
	return def
}
