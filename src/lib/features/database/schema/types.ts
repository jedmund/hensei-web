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
import type { CreateQueryOptions } from '@tanstack/svelte-query'
import type { z } from 'zod'
import type {
	BuiltInCellType,
	ColumnBase,
	DataTableColumn,
	RowHeight
} from '$lib/components/data-table/types'
import type { FilterOption, RecentPreset } from '$lib/components/data-table/filters'
import type { SortSpec } from '$lib/components/data-table/urlState'
import type { ResourceSection } from '$lib/features/database/sections'
import type { DetailEntityType } from '$lib/components/ui/DetailsHeader.svelte'
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
	| 'uncapIndicator'
	| 'weaponAwakenings'
	| 'weaponForge'
	| 'elementVariantIds'
	| 'bulletSlots'
	| 'characterUncap'
	| 'characterRelated'
	| 'weaponSeriesVariants'
	| 'awakeningImage'
	| 'raidGroupRaids'
	| 'eventRaids'

/**
 * Form inputs the edit and create forms resolve by name, for values no
 * built-in input edits (or, on a read-only field, a live preview)
 */
export type InputName =
	| 'uncapIndicator'
	| 'weaponAwakenings'
	| 'elementVariantIds'
	| 'characterUncap'
	| 'weaponSeriesVariants'
	| 'awakeningImage'
	| 'eventRaids'

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
	| 'character'
	| 'weapon'
	| 'weaponSeries'
	| 'weaponSeriesVariant'
	| 'awakening'
	| 'characterSeries'
	| 'summonSeries'
	| 'raidGroup'
	| 'raid'
	| 'job'

/** Column options. The column id is the field key, the header its label */
export type ListOptions<Row> = Partial<Omit<ColumnBase<Row>, 'id' | 'header'>> & {
	header?: Message
	/** A built-in cell type other than the kind's default (e.g. `element`) */
	type?: BuiltInCellType
}

/**
 * Query options for a filter's option data, as `createQuery` takes them.
 * Untyped: options read the data as `unknown` anyway
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FilterQuery = () => CreateQueryOptions<any, any, any, any>

export type FieldFilter =
	| {
			kind: 'multi'
			label?: Message
			/**
			 * Defaults to the enum's options. `data` is the `query` result (e.g.
			 * the series list), undefined until it loads.
			 */
			options?: (data: unknown) => FilterOption[]
			/** Loads what `options` needs; the list runs it */
			query?: FilterQuery
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

/** How a field shows in the detail view, where it differs from the forms */
export interface DetailOptions<Full> {
	/** Replaces `when` in the detail (e.g. dates shown whatever the uncap state) */
	when?: (values: Values) => boolean
	/** Leave the row out when there's no value, instead of showing a dash */
	hideWhenEmpty?: boolean
	/** What an empty value shows. Defaults to a dash */
	empty?: string | Message
	/** The value to show, when it isn't what `read` returns (e.g. a name for an id) */
	value?: (record: Full) => unknown
	/** Show the sublabel here too. Defaults to true; some hints are only for editing */
	sublabel?: boolean
}

export interface FieldRender<Row> {
	/**
	 * The list cell, drawn by this component (a `component` column). Unlike
	 * the detail and form renderers, a cell is referenced directly: it's typed
	 * by the row, and only the list screens load definitions
	 */
	cell?: Component<{ row: Row }>
	/** Detail display drawn by a named component */
	detail?: ComponentName
	/** Form input drawn by a named component */
	input?: InputName
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
	/** Defaults to `keep` for booleans and lists (tags included), `null` otherwise */
	empty?: EmptyPolicy
	/** Initial create value, and the value when the record has none */
	default?: unknown
	required?: boolean
	list?: ListOptions<Row>
	filter?: FieldFilter
	/**
	 * `false` keeps the field off both forms. A read-only field (`write:
	 * false`) is on them only when it sets this: a form-only value, like a toggle
	 */
	form?: false | FormOptions
	/** Shown, validated and sent only while this holds */
	when?: (values: Values) => boolean
	/**
	 * What's sent while `when` hides the field: `omit` (the default) leaves the
	 * param out, `empty` sends an empty value under the `empty` policy (so
	 * hiding the field clears it)
	 */
	whenHidden?: 'omit' | 'empty'
	/** Detail view options; `false` keeps the field out of the detail (form-only) */
	detail?: false | DetailOptions<Full>
	/** Extra rules the value must also pass */
	validate?: z.ZodType
	render?: FieldRender<Row>
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
		/** Whole numbers, edited as a comma-separated list (e.g. a unit's character IDs) */
		| { kind: 'numberList' }
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

/** A titled group of fields. It shows while any of its fields shows */
export interface Section {
	id: string
	title: Message
	/** Field keys in display order */
	fields: string[]
	/** Draws the section's body, owning the listed fields */
	component?: ComponentName
	/**
	 * `false`: the component draws its own titled container, so it can leave
	 * the section out when it has nothing to show (e.g. data it loads itself)
	 */
	container?: false
}

/** Booleans (field keys) and API-only flags shown as one toggles menu */
export interface ToggleGroupDef {
	id: string
	label: Message
	toggles: Array<string | { key: string; label: Message }>
}

export interface ListDef<Row> {
	/** Accessible name for the table */
	label: Message
	/** The generated list screen's page title. Defaults to `label` */
	pageTitle?: Message
	/** Lowercase plural noun for the search placeholder, e.g. "weapons" */
	entity: Message
	empty: Message
	/** The field that titles a row: the panel header before the record loads */
	title: string
	/** The field holding a row's element id, which colours the open row's bar */
	element?: string
	/**
	 * A row's id: its panel id and URL (see `recordPath`), the same id the
	 * record's `routeId` gives. Defaults to the Granblue ID; style shifts share
	 * theirs, so characters need their own, and records without one use their
	 * slug
	 */
	rowId?: (row: Row) => string
	/** Field keys, or a literal column for things that aren't fields (the thumbnail) */
	columns: Array<string | DataTableColumn<Row>>
	/** Field keys with a `multi` or `recent` filter, or toggle groups */
	filters: Array<string | ToggleGroupDef>
	/** Fields every request asks for, whichever columns are visible */
	baseFields: string[]
	defaultSort: SortSpec[]
	rowHeight?: RowHeight
	/** Keep the first column in place while scrolling sideways */
	pinFirstColumn?: boolean
	/**
	 * Old `?view=` values of this list and the pages that replaced them, e.g.
	 * `{ groups: '/database/raid-groups' }`: the list redirects there
	 */
	movedViews?: Record<string, string>
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
	/** The route's resource name */
	resource: string
}

/** The panel body: the detail view without the page around it */
export type RecordBodyProps = {
	/** The record's route id (its `routeId`): a Granblue ID, or a slug */
	id: string
	role: number
	/** Requested detail tab (local state in the panel) */
	tab: string | null
	onTabChange: (tab: DetailTab) => void
}

/** A screen component, imported only when its route or panel opens */
type Lazy<Props extends Record<string, unknown>> = () => Promise<{ default: Component<Props> }>

/**
 * Hand-written screens that replace the generated ones. The list is always
 * generated (`ResourceTable` under the list's page title); the detail and the
 * panel when a resource has a `record`, the edit page when it can also
 * `save.update`, and the new page when it can `save.create`. The generic
 * routes 404 any other screen the resource doesn't have.
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

/** What a record tab component receives */
export interface RecordTabProps<Full> {
	record: Full
	canEdit: boolean
	/** The viewer's role, for tabs with rules of their own (staff picks) */
	role: number
	/** Reloads the record (e.g. after a re-parse changed it) */
	refetch: () => void
}

/** A detail tab after Info. Referenced directly, like list cells */
export interface RecordTab<Full> {
	id: Exclude<DetailTab, 'info'>
	label: Message
	component: Component<RecordTabProps<Full>>
	/** Shown only while this holds */
	when?: (record: Full) => boolean
	/** Only editors see it */
	editorOnly?: boolean
}

/** How a resource's forms save */
export interface SaveDef<Full> {
	/**
	 * Sends the edit form's payload for the record. Resolves with the saved
	 * record; rejects with the adapter error (a 422 carries `errors` by param)
	 */
	update?: (record: Full, payload: Values) => Promise<Full>
	/**
	 * Sends the create form's payload. Resolves with the new record; rejects
	 * like `update`
	 */
	create?: (payload: Values) => Promise<Full>
	/**
	 * Checks that need the server, by field key, run on the create form only
	 * (a loaded record passes them by definition). Each runs once the value
	 * passes the field's own rules, debounced while typing, and resolves with
	 * the problem or null. A problem blocks saving until the value changes; a
	 * rejected check blocks nothing (the server validates on save anyway).
	 */
	asyncValidate?: Record<string, (value: unknown, values: Values) => Promise<string | null>>
	/** Runs after a create, without holding up the form (e.g. queueing image downloads) */
	afterCreate?: (record: Full) => Promise<unknown>
	/**
	 * Other queries a save makes stale, beyond the record and the admin list
	 * (e.g. Home, which shows events, or the series lists other pages' filters read)
	 */
	invalidates?: () => readonly (readonly unknown[])[]
}

export interface RecordDef<Full> {
	/**
	 * The full record the detail and edit pages load, by route id. Rejects with
	 * an error carrying `status: 404` when there's no such record.
	 */
	fetch: (id: string) => Promise<Full>
	/** The same record as a query, so the panel and the page share its cache */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	query: (id: string) => CreateQueryOptions<Full, any, Full, any>
	/** The record's route id (what `fetch` takes), e.g. its Granblue ID */
	routeId: (record: Full) => string
	/**
	 * The record's page, when it isn't `/database/<name>/<routeId>` (e.g. a
	 * style shift's own page): where saving the forms goes
	 */
	path?: (record: Full) => string
	/** Singular noun for the page header, e.g. "Weapon" */
	noun: Message
	/** Header kind: picks the placeholder image and the labels under the name */
	type?: DetailEntityType
	/** The header image. Without one the header shows only the name */
	image?: (record: Full) => string
	/** Tried before the placeholder when `image` fails to load */
	fallbackImage?: (record: Full) => string | undefined
	/** The record's element, which colours its buttons */
	element?: (record: Full) => number | null | undefined
	/** Tabs after Info, in order */
	tabs?: RecordTab<Full>[]
}

export interface ResourceDef<Row = unknown, Full = unknown> {
	/** Route segment, admin resource and list storage key, e.g. `weapons` */
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
	save?: SaveDef<Full>
	/** Its sidebar entry (see `resourceSections` in the database sections) */
	section?: ResourceSection
	screens?: Screens<Full>
}

/** Keeps the row and record types on a definition */
export function defineResource<Row, Full>(def: ResourceDef<Row, Full>): ResourceDef<Row, Full> {
	return def
}
