/**
 * The summon series resource: its list columns, header icon and the payloads
 * its edit and new forms send, with blanks sent as null.
 */
import { describe, expect, it } from 'vitest'
import { columnHeader } from '$lib/components/data-table/types'
import { columnsFor } from '$lib/features/database/schema/columns'
import { fromRecord, initialValues, toPayload } from '$lib/features/database/schema/form'
import type { SummonSeries } from '$lib/types/api/summonSeries'
import { summonSeriesResource as def } from './resource'

const magna: SummonSeries = {
	id: 'ss-magna',
	name: { en: 'Magna', ja: 'マグナ' },
	slug: 'magna',
	order: 3,
	summonCount: 6
}

describe('summon series resource: list', () => {
	it('leads with the icon, the counts hidden', () => {
		const columns = columnsFor(def)
		expect(columns.map((c) => [c.id, columnHeader(c), c.defaultHidden ?? false])).toEqual([
			['icon', '', false],
			['order', 'Order', false],
			['name', 'Name', false],
			['slug', 'Slug', false],
			['summon_count', 'Summon Count', true],
			['updated_at', 'Last edited', true]
		])
		expect(def.list.defaultSort).toEqual([{ id: 'order', desc: false }])
	})

	it("draws each series' icon by slug, in the list and the header", () => {
		const icon = columnsFor(def).find((c) => c.id === 'icon')
		const row = { id: 'ss-magna', slug: 'magna', nameEn: 'Magna', nameJp: 'マグナ', order: 3 }
		expect(icon?.type === 'image' && typeof icon.image === 'function' && icon.image(row)).toEqual({
			src: expect.stringMatching(/\/icons\/summon-series\/magna\.png$/)
		})
		expect(def.record?.image?.(magna)).toMatch(/\/icons\/summon-series\/magna\.png$/)
		expect(def.record?.type).toBe('series')
	})
})

describe('summon series resource: payloads', () => {
	it('sends the edited fields, with a blank Japanese name as null', () => {
		const payload = (series: SummonSeries) => toPayload(def, fromRecord(def, series), 'edit')
		expect(payload(magna)).toEqual({ name_en: 'Magna', name_jp: 'マグナ', slug: 'magna', order: 3 })
		expect(payload({ ...magna, name: { en: 'Magna', ja: '' } })).toMatchObject({ name_jp: null })
	})

	it('starts a new series at order 0', () => {
		const values = { ...initialValues(def), name: { en: 'Bellum', ja: 'ベルム' }, slug: 'bellum' }
		expect(toPayload(def, values, 'create')).toEqual({
			name_en: 'Bellum',
			name_jp: 'ベルム',
			slug: 'bellum',
			order: 0
		})
	})
})
