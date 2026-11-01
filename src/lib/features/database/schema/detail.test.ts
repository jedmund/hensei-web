import { describe, expect, it } from 'vitest'
import { weaponsResource } from '$lib/features/database/weapons/resource'
import { detailRecords } from '$lib/features/database/weapons/__fixtures__/detailRecords'
import { detailLayout, detailText, recordTitle, shownInDetail } from './detail'
import type { Field } from './types'

const label = () => 'Label'
const field = (f: Partial<Field> & Pick<Field, 'kind'>) => ({ key: 'k', label, ...f }) as Field

describe('detailText', () => {
	it('shows text and dates, with a dash when empty', () => {
		expect(detailText(field({ kind: 'text' }), 'Sword')).toBe('Sword')
		expect(detailText(field({ kind: 'text' }), '')).toBe('—')
		expect(detailText(field({ kind: 'date' }), '2024-01-15')).toBe('2024-01-15')
		expect(detailText(field({ kind: 'date' }), null)).toBe('—')
	})

	it('prints zero, and the field’s own empty text', () => {
		expect(detailText(field({ kind: 'number' }), 0)).toBe('0')
		expect(detailText(field({ kind: 'number' }), null)).toBe('—')
		expect(detailText(field({ kind: 'number', detail: { empty: '0' } }), undefined)).toBe('0')
	})

	it('shows booleans as Yes or No', () => {
		expect(detailText(field({ kind: 'boolean' }), true)).toBe('Yes')
		expect(detailText(field({ kind: 'boolean' }), undefined)).toBe('No')
	})

	it('shows enum labels; elements and proficiencies draw their label component', () => {
		const options = () => [
			{ value: 2, label: 'SR' },
			{ value: 3, label: () => 'SSR' }
		]
		expect(detailText(field({ kind: 'enum', options }), 3)).toBe('SSR')
		expect(detailText(field({ kind: 'enum', options }), null)).toBe('—')
		expect(detailText(field({ kind: 'enum', options, list: { type: 'element' } }), 1)).toBeNull()
		expect(
			detailText(field({ kind: 'enum', options, list: { type: 'proficiency' } }), 1)
		).toBeNull()
	})

	it('joins enum lists in value order', () => {
		const options = () => [
			{ value: 1, label: 'Premium' },
			{ value: 2, label: 'Classic' }
		]
		expect(detailText(field({ kind: 'enumList', options }), [2, 1])).toBe('Classic, Premium')
		expect(detailText(field({ kind: 'enumList', options }), [])).toBe('—')
	})

	it('leaves codes, links and tags to components unless empty', () => {
		for (const kind of ['code', 'link', 'tags'] as const) {
			const f = field({ kind, href: () => null } as Partial<Field> & Pick<Field, 'kind'>)
			expect(detailText(f, kind === 'tags' ? ['a'] : 'x')).toBeNull()
			expect(detailText(f, kind === 'tags' ? [] : '')).toBe('—')
		}
	})

	it('names references', () => {
		const series = field({ kind: 'reference', resource: 'weaponSeries' })
		expect(detailText(series, { id: 's', slug: 's', name: { en: 'Dark Opus', ja: '' } })).toBe(
			'Dark Opus'
		)
		expect(detailText(series, null)).toBe('—')
		const character = field({ kind: 'reference', resource: 'character' })
		expect(detailText(character, { granblueId: '3040001000', name: { en: 'Juri' } })).toBeNull()
		expect(detailText(field({ kind: 'reference', resource: 'weapon' }), 'Forged')).toBe('Forged')
		const list = field({ kind: 'referenceList', resource: 'awakening' })
		expect(detailText(list, [{ name: { en: 'Attack' } }, { name: { en: 'C.A.' } }])).toBe(
			'Attack, C.A.'
		)
	})

	it('leaves custom fields with a component to it', () => {
		expect(
			detailText(field({ kind: 'custom', render: { detail: 'uncapIndicator' } }), {})
		).toBeNull()
		expect(detailText(field({ kind: 'custom' }), null)).toBe('—')
	})
})

describe('shownInDetail', () => {
	it('drops form-only fields', () => {
		expect(shownInDetail(field({ kind: 'text', detail: false }), {})).toBe(false)
	})

	it('uses detail.when in place of when', () => {
		const hidden = () => false
		expect(shownInDetail(field({ kind: 'text', when: hidden }), {})).toBe(false)
		expect(
			shownInDetail(field({ kind: 'text', when: hidden, detail: { when: () => true } }), {})
		).toBe(true)
	})

	it('hides empty values only when asked', () => {
		const f = field({ kind: 'number', detail: { hideWhenEmpty: true } })
		expect(shownInDetail(f, { k: null })).toBe(false)
		expect(shownInDetail(f, { k: 0 })).toBe(true)
		expect(shownInDetail(field({ kind: 'number' }), { k: null })).toBe(true)
	})
})

describe('detailLayout for weapons', () => {
	const keys = (record: object) =>
		Object.fromEntries(
			detailLayout(weaponsResource, record as never).blocks.map(({ section, rows }) => [
				section.id,
				rows.map((r) => r.field.key)
			])
		)

	it('lays out a plain weapon', () => {
		expect(keys(detailRecords.plain)).toEqual({
			metadata: ['name', 'rarity', 'granblue_id'],
			gacha: ['promotions', 'recruits'],
			uncap: ['uncap'],
			details: ['element', 'proficiency', 'series', 'extra', 'limit'],
			hp: ['min_hp', 'max_hp'],
			attack: ['min_atk', 'max_atk'],
			caps: ['max_level', 'max_skill_level', 'max_awakening_level'],
			nicknames: ['nicknames'],
			// Every date, uncapped or not
			dates: ['release_date', 'flb_date', 'ulb_date', 'transcendence_date'],
			links: ['wiki_en', 'wiki_ja', 'gamewith', 'kamigame']
		})
	})

	it('shows variant IDs, the variant and awakenings when the weapon has them', () => {
		const layout = keys(detailRecords.gunNull)
		expect(layout.element_variant_ids).toEqual(['element_variant_ids'])
		expect(layout.details).toContain('weapon_series_variant_id')
		expect(layout.hp).toEqual(['min_hp', 'max_hp', 'max_hp_flb', 'max_hp_ulb'])
		expect(layout.awakenings).toEqual(['awakening_ids'])
		expect(layout.forge).toBeUndefined()
	})

	it('shows the variant by name', () => {
		const details = detailLayout(weaponsResource, detailRecords.gunNull).blocks.find(
			(b) => b.section.id === 'details'
		)
		expect(details?.rows.find((r) => r.field.key === 'weapon_series_variant_id')?.value).toBe(
			'Forged'
		)
	})

	it('shows the extra prerequisite and the forge chain when set', () => {
		expect(keys(detailRecords.forge).uncap).toEqual(['uncap', 'extra_prerequisite'])
		expect(keys(detailRecords.forge).forge).toEqual(['forge_chain', 'forged_from', 'forge_order'])
	})

	it('shows bullet slots when the weapon has some, whatever its proficiency', () => {
		const slots = { ...detailRecords.plain, bulletSlots: [1, 2] }
		expect(keys(slots).bullet_slots).toEqual(['bullet_slots'])
		expect(keys({ ...detailRecords.plain, proficiency: 6 }).bullet_slots).toBeUndefined()
	})

	it('shows the max exorcism level when set', () => {
		expect(keys({ ...detailRecords.plain, maxExorcismLevel: 3 }).caps).toContain(
			'max_exorcism_level'
		)
	})
})

describe('recordTitle', () => {
	it('reads the list title field, English first', () => {
		expect(recordTitle(weaponsResource, detailRecords.plain)).toBe('Sunset Dagger')
		expect(recordTitle(weaponsResource, { ...detailRecords.plain, name: { ja: '紅陽刃' } })).toBe(
			'紅陽刃'
		)
	})
})
