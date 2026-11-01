/**
 * Parity: the events resource must reproduce what the hand-written events
 * pages did: the old table's columns, and the payload the shared event form
 * built (`formToEventPayload`, transcribed below), with the changes decided
 * for GBF-143 applied on top.
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor, filtersFor } from '$lib/features/database/schema/columns'
import { detailLayout } from '$lib/features/database/schema/detail'
import { fromRecord, initialValues, toPayload } from '$lib/features/database/schema/form'
import { buildZod, issueErrors, issueMessage } from '$lib/features/database/schema/validation'
import type { Values } from '$lib/features/database/schema/types'
import type { AdminEventRow } from '$lib/types/api/admin'
import { ELEMENT_REQUIRED_KINDS, type GameEvent } from '$lib/types/api/event'
import { isoToJstInput, jstInputToIso } from '$lib/utils/jstDateTime'
import { eventsResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { guildWar, story } = detailRecords

describe('events resource: list', () => {
	const columns = columnsFor(def)
	const column = (id: string) => columns.find((c) => c.id === id)!

	it("keeps the old table's columns, the dates split in two", () => {
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['name', 'Name', false],
			['kind', 'Kind', false],
			['element', 'Element', false],
			['starts_at', 'Starts (JST)', false],
			['ends_at', 'Ends (JST)', false],
			['raid_count', 'Raids', false],
			['series', 'Series', true],
			['event_number', 'Unite and Fight number', true],
			['updated_at', 'Last edited', true]
		])
	})

	it("shows a Guild War's number with its kind, and times in JST", () => {
		const row = {
			id: 'e',
			kind: 'unite_and_fight',
			eventNumber: 72,
			startsAt: guildWar.startsAt,
			endsAt: guildWar.endsAt
		} as AdminEventRow
		expect(column('kind').value?.(row)).toBe('Unite and Fight #72')
		expect(column('kind').value?.({ ...row, kind: 'story_event', eventNumber: null })).toBe(
			'Story Event'
		)
		expect(column('kind').fields).toEqual(['kind', 'event_number'])
		expect(column('starts_at').value?.(row)).toBe('2026/11/08 19:00')
		expect(column('ends_at').value?.(row)).toBe('2026/11/15 23:59')
	})

	it('filters on kind (Unite and Fight among them), boss element and series', () => {
		const filters = filtersFor(def)
		expect(filters.map((f) => (f.kind === 'toggles' ? f.id : [f.key, f.kind]))).toEqual([
			['kind', 'multi'],
			['element', 'multi'],
			['series', 'multi']
		])
		const kind = filters.find((f) => f.kind === 'multi' && f.key === 'kind')
		if (kind?.kind !== 'multi') throw new Error('no kind filter')
		expect(kind.options().map((o) => o.value)).toContain('unite_and_fight')
	})

	it('keys rows by id, newest first', () => {
		expect(def.list.rowId!({ id: 'e-1' } as AdminEventRow)).toBe('e-1')
		expect(def.list.defaultSort).toEqual([{ id: 'starts_at', desc: true }])
	})
})

// --- The shared event form, transcribed ---

function legacyForm(event: GameEvent) {
	return {
		nameEn: event.name.en ?? '',
		nameJp: event.name.ja ?? '',
		kind: event.kind,
		series: event.series ?? '',
		element: event.element ?? 0,
		startsAt: isoToJstInput(event.startsAt),
		endsAt: isoToJstInput(event.endsAt),
		raids: [...(event.raids ?? [])],
		eventNumber: event.eventNumber ?? 0
	}
}

/** `formToEventPayload`, with the adapter's snake_case keys */
function legacyPayload(form: ReturnType<typeof legacyForm>) {
	return {
		name_en: form.nameEn.trim(),
		name_jp: form.nameJp.trim(),
		kind: form.kind,
		series: form.series || null,
		element: form.element > 0 ? form.element : null,
		starts_at: jstInputToIso(form.startsAt),
		ends_at: jstInputToIso(form.endsAt),
		raid_ids: form.raids.map((r) => r.id),
		event_number: form.kind === 'unite_and_fight' ? Math.trunc(form.eventNumber) : null
	}
}

/** GBF-143: a blank Japanese name sends null (the old form sent '') */
function decided(legacy: Record<string, unknown>) {
	return { ...legacy, name_jp: legacy.name_jp === '' ? null : legacy.name_jp }
}

describe('events resource: payload', () => {
	it.each(['guildWar', 'story'] as const)('matches the old form (%s)', (name) => {
		const event = detailRecords[name]
		expect(toPayload(def, fromRecord(def, event), 'edit')).toEqual(
			decided(legacyPayload(legacyForm(event)))
		)
	})

	it('edits the times in JST and sends them as ISO timestamps', () => {
		const values = fromRecord(def, guildWar)
		expect(values.starts_at).toBe('2026-11-08T19:00')
		expect(toPayload(def, { ...values, ends_at: '2026-11-15T23:30' }, 'edit').ends_at).toBe(
			'2026-11-15T14:30:00.000Z'
		)
	})

	it('writes the raids as their ids, in order', () => {
		const values = { ...fromRecord(def, guildWar), raids: ['r-2', 'r-uf-nm200'] }
		expect(toPayload(def, values, 'edit').raid_ids).toEqual(['r-2', 'r-uf-nm200'])
	})

	it("sends no element for the picker's Any, and no number once it's not a Guild War", () => {
		const values = { ...fromRecord(def, guildWar), kind: 'story_event', element: 0 }
		const payload = toPayload(def, values, 'edit')
		expect(payload.element).toBeNull()
		expect(payload.event_number).toBeNull()
	})

	it('starts a new event as a story event with nothing linked', () => {
		const values = initialValues(def)
		expect(values).toMatchObject({ kind: 'story_event', raids: [] })
	})
})

describe('events resource: validation', () => {
	const valid: Values = {
		...initialValues(def),
		name: { en: 'Event', ja: '' },
		starts_at: '2026-11-08T19:00',
		ends_at: '2026-11-15T23:59'
	}
	const errors = (values: Values) => {
		const result = buildZod(def, 'create').safeParse(
			{ ...valid, ...values },
			{ error: issueMessage }
		)
		return result.success ? {} : issueErrors(result.error.issues)
	}

	it('accepts a complete event', () => {
		expect(errors({})).toEqual({})
	})

	it('needs a name and both times, the end after the start', () => {
		expect(Object.keys(errors({ name: { en: '', ja: '' }, starts_at: '' }))).toEqual(
			expect.arrayContaining(['name.en', 'starts_at'])
		)
		expect(errors({ ends_at: '2026-11-08T19:00' }).ends_at).toBe('Must be after the start')
	})

	it.each(ELEMENT_REQUIRED_KINDS)('needs a boss element for %s', (kind) => {
		const extra = kind === 'unite_and_fight' ? { event_number: 72 } : {}
		expect(errors({ kind, ...extra }).element).toBe(
			'Required for Unite and Fight and Dread Barrage'
		)
		expect(errors({ kind, element: 2, ...extra })).toEqual({})
	})

	it('needs a Guild War number of at least 1 for Unite and Fight', () => {
		const guild = { kind: 'unite_and_fight', element: 2 }
		expect(errors(guild).event_number).toBe('Required')
		expect(errors({ ...guild, event_number: 0 }).event_number).toBe('Must be at least 1')
	})
})

describe('events resource: detail', () => {
	it("shows a Guild War's number, and none for other kinds", () => {
		const keys = (event: GameEvent) =>
			detailLayout(def, event).blocks.flatMap((b) => b.rows.map((r) => r.field.key))
		expect(keys(guildWar)).toContain('event_number')
		expect(keys(story)).not.toContain('event_number')
	})
})
