/**
 * The events resource: the event schedule, described once (GBF-143).
 * Unite and Fight is an event kind (it carries the Guild War number), not a
 * resource of its own. Curators read the list and details and manage staff
 * picks (the Staff picks tab); editing needs an editor (see the section's
 * `minRole`). Times are edited and shown in JST, as the game announces them.
 */
import * as m from '$lib/paraglide/messages'
import { eventAdapter } from '$lib/api/adapters/event.adapter'
import { eventQueries } from '$lib/api/queries/event.queries'
import { elementFilterOptions } from '$lib/components/data-table/filterOptions'
import { eventsSection } from '$lib/features/database/events/section'
import EventBannerTab from '$lib/features/database/events/tabs/EventBannerTab.svelte'
import EventStaffPicksTab from '$lib/features/database/events/tabs/EventStaffPicksTab.svelte'
import {
	defineResource,
	type EnumOption,
	type Field,
	type Values
} from '$lib/features/database/schema/types'
import {
	ELEMENT_REQUIRED_KINDS,
	type EventKind,
	type EventPayload,
	type GameEvent
} from '$lib/types/api/event'
import { getElementOptions } from '$lib/utils/element'
import { getHostedImageUrl } from '$lib/utils/images/core'
import { eventKindLabel, eventKindOptions, eventSeriesOptions } from '$lib/utils/eventLabels'
import { formatJstDateTime, isoToJstInput, jstInputToIso } from '$lib/utils/jstDateTime'
import type { AdminEventRow } from '$lib/types/api/admin'

const uniteAndFight = (v: Values) => v.kind === 'unite_and_fight'
const needsElement = (v: Values) => ELEMENT_REQUIRED_KINDS.includes(v.kind as EventKind)

const kindOptions = (): EnumOption[] => eventKindOptions()
// "None" is the select's own blank option
const seriesOptions = (): EnumOption[] => eventSeriesOptions().filter((o) => o.value !== '')

/**
 * A start or end time: edited as a JST `datetime-local` value, sent as an
 * ISO timestamp, shown as "2026/11/08 19:00"
 */
function jstTime(
	key: 'starts_at' | 'ends_at',
	label: () => string,
	prop: 'startsAt' | 'endsAt'
): Field<AdminEventRow, GameEvent> {
	return {
		key,
		kind: 'datetime',
		label,
		required: true,
		read: (e) => isoToJstInput(e[prop]),
		write: { value: (v) => jstInputToIso(v as string) },
		detail: { value: (e) => formatJstDateTime(e[prop]) },
		list: { value: (e) => formatJstDateTime(e[prop]), width: '152px' }
	}
}

export const eventsResource = defineResource<AdminEventRow, GameEvent>({
	name: 'events',
	fields: [
		// Details
		{
			key: 'name',
			kind: 'localized',
			label: m.db_events_col_name,
			keys: { en: 'name_en', ja: 'name_jp' },
			labels: { en: m.db_events_field_name_en, ja: m.db_events_field_name_jp },
			required: true,
			list: { primary: true, minWidth: '240px' }
		},
		{
			key: 'kind',
			kind: 'enum',
			label: m.db_events_field_kind,
			options: kindOptions,
			default: 'story_event',
			required: true,
			list: {
				header: m.db_events_col_kind,
				// A Guild War shows its number
				value: (e) =>
					e.kind === 'unite_and_fight' && e.eventNumber
						? `${eventKindLabel(e.kind)} #${e.eventNumber}`
						: eventKindLabel(e.kind as EventKind),
				fields: ['kind', 'event_number'],
				width: '200px'
			},
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'series',
			kind: 'enum',
			label: m.db_events_field_series,
			sublabel: m.db_events_series_hint,
			options: seriesOptions,
			detail: { sublabel: false, empty: m.event_series_none },
			list: { sortable: false, defaultHidden: true },
			filter: { kind: 'multi', facet: true }
		},
		{
			key: 'element',
			kind: 'enum',
			label: m.db_events_field_element,
			sublabel: m.db_events_element_required,
			options: getElementOptions,
			// The picker's Any (0) means no element
			write: { value: (v) => v || null },
			detail: { sublabel: false },
			list: { header: m.db_events_col_element, type: 'element', sortable: false },
			filter: { kind: 'multi', options: () => elementFilterOptions(), facet: true }
		},
		{
			key: 'event_number',
			kind: 'number',
			label: m.db_events_field_number,
			int: true,
			min: 1,
			required: true,
			when: uniteAndFight,
			// Other kinds have no number
			whenHidden: 'empty',
			detail: { hideWhenEmpty: true },
			list: { defaultHidden: true, width: '96px' }
		},
		jstTime('starts_at', m.db_events_field_starts_at, 'startsAt'),
		jstTime('ends_at', m.db_events_field_ends_at, 'endsAt'),
		// Linked raids, in order: picked with the raid pane
		{
			key: 'raids',
			kind: 'referenceList',
			label: m.db_events_section_raids,
			resource: 'raid',
			write: 'raid_ids',
			render: { input: 'eventRaids' }
		},
		// List only
		{
			key: 'raid_count',
			kind: 'number',
			label: m.db_events_col_raids,
			write: false,
			detail: false,
			list: { sortable: false, width: '88px' }
		},
		{
			key: 'updated_at',
			kind: 'datetime',
			label: m.db_col_updated_at,
			write: false,
			detail: false,
			list: { defaultHidden: true }
		}
	],

	list: {
		label: m.db_events_label,
		entity: m.db_events_entity,
		empty: m.db_events_empty,
		title: 'name',
		element: 'element',
		rowId: (e) => e.id,
		columns: [
			'name',
			'kind',
			'element',
			'starts_at',
			'ends_at',
			'raid_count',
			'series',
			'event_number',
			'updated_at'
		],
		filters: ['kind', 'element', 'series'],
		baseFields: ['name_en', 'name_jp'],
		defaultSort: [{ id: 'starts_at', desc: true }]
	},

	// The detail Info tab's order; edit and create use it too
	layout: {
		detail: [
			{
				id: 'details',
				title: m.db_events_section_details,
				fields: ['name', 'kind', 'series', 'element', 'event_number', 'starts_at', 'ends_at']
			},
			{
				id: 'raids',
				title: m.db_events_section_raids,
				fields: ['raids'],
				component: 'eventRaids'
			}
		]
	},

	// The API's rules: themed kinds need their boss element, and an event ends after it starts
	refine: (v, issue) => {
		if (needsElement(v) && !v.element) issue('element', m.db_events_element_required())
		const starts = jstInputToIso(v.starts_at as string)
		const ends = jstInputToIso(v.ends_at as string)
		if (starts && ends && Date.parse(ends) <= Date.parse(starts)) {
			issue('ends_at', m.db_events_error_ends_before_start())
		}
	},

	record: {
		fetch: (id) => eventAdapter.getEvent(id),
		query: (id) => eventQueries.byId(id),
		routeId: (e) => e.id,
		noun: m.db_events_type,
		type: 'raid',
		image: (e) => getHostedImageUrl(e.imageUrl) ?? '',
		element: (e) => e.element,
		tabs: [
			{ id: 'picks', label: m.db_picks_title, component: EventStaffPicksTab },
			{
				id: 'images',
				label: m.db_events_section_image,
				component: EventBannerTab,
				editorOnly: true
			}
		]
	},

	save: {
		// Payload keys are the strong params by construction (see contract.test.ts)
		update: (e, payload) => eventAdapter.updateEvent(e.id, payload as Partial<EventPayload>),
		create: (payload) => eventAdapter.createEvent(payload as unknown as EventPayload)
	},

	section: eventsSection,

	// The list adds the schedule sync for editors
	screens: {
		list: () => import('$lib/features/database/events/screens/EventsListScreen.svelte')
	}
})
