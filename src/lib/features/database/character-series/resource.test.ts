/**
 * Parity: the character series resource must reproduce what the hand-written
 * pages did: the Series view's columns on the characters list, and the edit
 * and new pages' payloads (transcribed below), with blanks sent as null.
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor } from '$lib/features/database/schema/columns'
import { fromRecord, initialValues, toPayload } from '$lib/features/database/schema/form'
import type { CharacterSeries } from '$lib/types/api/characterSeries'
import { characterSeriesResource as def } from './resource'
import { detailRecords } from './__fixtures__/detailRecords'

const { grand, empty } = detailRecords

describe('character series resource: list', () => {
	it("keeps the Series view's columns, the counts hidden", () => {
		const columns = columnsFor(def)
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['order', 'Order', false],
			['name', 'Name', false],
			['slug', 'Slug', false],
			['character_count', 'Character Count', true],
			['updated_at', 'Last edited', true]
		])
		expect(def.list.defaultSort).toEqual([{ id: 'order', desc: false }])
	})
})

describe('character series resource: payload parity', () => {
	it('matches the edit page, with a blank Japanese name sent as null', () => {
		const payload = (series: CharacterSeries) => toPayload(def, fromRecord(def, series), 'edit')
		expect(payload(grand)).toEqual({
			name_en: 'Grand',
			name_jp: 'リミテッド',
			slug: 'grand',
			order: 1
		})
		expect(payload(empty)).toEqual({ name_en: 'Formal', name_jp: null, slug: 'formal', order: 15 })
	})

	it("starts from the new page's defaults", () => {
		const values = { ...initialValues(def), name: { en: 'Saint', ja: 'セイント' }, slug: 'saint' }
		expect(toPayload(def, values, 'create')).toEqual({
			name_en: 'Saint',
			name_jp: 'セイント',
			slug: 'saint',
			order: 0
		})
	})
})
