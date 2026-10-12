import { describe, it, expect } from 'vitest'
import { EXPECTED } from '$lib/api/adapters/__tests__/fixtures/solomonis-guidebook.fixtures'
import {
	DEFAULT_GUIDE_EFFECT_FILTERS,
	MISSING_VALUE,
	addEffect,
	canAddEffect,
	filterGuideEffects,
	formatGuideEffectName,
	groupByRarity,
	guideEffectIconCategory,
	guideEffectIconSrc,
	guideEffectRawName,
	hasAcquiredOrder,
	hasValuePlaceholder,
	heldCount,
	removeEntry,
	sortByAcquiredOrder,
	toGuidebookInput,
	updateEntry
} from '../guidebook'
import type { GuideEffect, GuidebookEntry } from '$lib/types/api/solomonis'

const catalogue = EXPECTED.guideEffects
const guidebook = EXPECTED.runSolomonis.guidebook

function effect(granblueId: number): GuideEffect {
	const found = catalogue.find((e) => e.granblueId === granblueId)
	if (!found) throw new Error(`no effect ${granblueId}`)
	return found
}

const stackable = catalogue.find((e) => e.stackable && e.rarity === 'rare')!
const nonStackable = catalogue.find((e) => !e.stackable)!

describe('names', () => {
	it('falls back to the other language when one is null', () => {
		expect(guideEffectRawName({ en: 'ATK', ja: null }, 'ja')).toBe('ATK')
		expect(guideEffectRawName({ en: null, ja: '攻撃力' }, 'en')).toBe('攻撃力')
		expect(guideEffectRawName({ en: 'ATK', ja: '攻撃力' }, 'ja')).toBe('攻撃力')
	})

	it('fills {value} from displayValue', () => {
		const entry = guidebook.find((g) => g.effect.granblueId === 85)!
		expect(hasValuePlaceholder(entry.effect)).toBe(true)
		const name = formatGuideEffectName(entry.effect, entry.displayValue, 'en')
		expect(name).toContain('(100% / Max: 100%)')
		expect(name).not.toContain('{value}')
	})

	it('shows a dash when the value is missing or blank', () => {
		const e = effect(85)
		expect(formatGuideEffectName(e, null, 'en')).toContain(`(${MISSING_VALUE} / Max: 100%)`)
		expect(formatGuideEffectName(e, '  ', 'en')).toContain(`(${MISSING_VALUE} / Max: 100%)`)
	})

	it('fills a value of 0', () => {
		const entry = guidebook.find((g) => g.effect.granblueId === 57)!
		expect(entry.displayValue).toBe('0')
		expect(formatGuideEffectName(entry.effect, entry.displayValue, 'en')).not.toContain(
			MISSING_VALUE
		)
	})

	it('leaves names without a placeholder alone', () => {
		expect(formatGuideEffectName(effect(1), '50%', 'en')).toBe('ATK +20%')
	})
})

describe('display order', () => {
	it('groups by rarity in the game order and keeps list order inside groups', () => {
		const shuffled = [guidebook[5]!, guidebook[0]!, guidebook[3]!, guidebook[1]!]
		const groups = groupByRarity(shuffled)
		expect(groups.map((g) => g.rarity)).toEqual(['unique', 'rare', 'normal'])
		expect(groups[0]!.entries.map((e) => e.effect.granblueId)).toEqual([74, 85])
	})

	it('puts cursed effects last', () => {
		const cursed = catalogue.find((e) => e.rarity === 'cursed')!
		const list = addEffect(guidebook, cursed)
		const groups = groupByRarity(list)
		expect(groups.at(-1)!.rarity).toBe('cursed')
	})

	it('sorts by known pickup order, unknown last in list order', () => {
		expect(hasAcquiredOrder(guidebook)).toBe(false)
		const ordered: GuidebookEntry[] = guidebook.map((g, i) => ({
			...g,
			acquiredOrder: i === 2 ? 1 : i === 0 ? 2 : null
		}))
		expect(hasAcquiredOrder(ordered)).toBe(true)
		const sorted = sortByAcquiredOrder(ordered)
		expect(sorted.map((e) => e.effect.granblueId)).toEqual([88, 74, 85, 37, 57, 7, 4])
	})
})

describe('editing', () => {
	it('appends a new effect at count 1', () => {
		const list = addEffect([], stackable)
		expect(list).toEqual([
			{
				effect: stackable,
				count: 1,
				displayValue: null,
				acquiredOrder: null,
				inherited: false,
				note: null
			}
		])
	})

	it('raises the count when a stackable effect is added again', () => {
		const list = addEffect(addEffect([], stackable), stackable)
		expect(list).toHaveLength(1)
		expect(heldCount(list, stackable.id)).toBe(2)
	})

	it('keeps a non-stackable effect at 1', () => {
		const once = addEffect([], nonStackable)
		expect(canAddEffect(once, nonStackable)).toBe(false)
		expect(addEffect(once, nonStackable)).toBe(once)
		expect(heldCount(once, nonStackable.id)).toBe(1)
	})

	it('clamps counts and forces non-stackable counts to 1', () => {
		const list = addEffect(addEffect([], stackable), nonStackable)
		const updated = updateEntry(updateEntry(list, stackable.id, { count: 0 }), nonStackable.id, {
			count: 4
		})
		expect(heldCount(updated, stackable.id)).toBe(1)
		expect(heldCount(updated, nonStackable.id)).toBe(1)
		expect(heldCount(updateEntry(list, stackable.id, { count: 7 }), stackable.id)).toBe(7)
	})

	it('allows at most one inherited effect', () => {
		let list = addEffect(addEffect([], stackable), nonStackable)
		list = updateEntry(list, stackable.id, { inherited: true })
		list = updateEntry(list, nonStackable.id, { inherited: true })
		expect(list.filter((e) => e.inherited).map((e) => e.effect.id)).toEqual([nonStackable.id])
		list = updateEntry(list, nonStackable.id, { inherited: false })
		expect(list.some((e) => e.inherited)).toBe(false)
	})

	it('trims text fields and turns blanks into null', () => {
		const list = updateEntry(addEffect([], stackable), stackable.id, {
			displayValue: ' 80% ',
			note: '   ',
			acquiredOrder: 2.7
		})
		expect(list[0]).toMatchObject({ displayValue: '80%', note: null, acquiredOrder: 2 })
	})

	it('removes an entry', () => {
		const list = removeEntry(guidebook, guidebook[0]!.effect.id)
		expect(list).toHaveLength(guidebook.length - 1)
	})

	it('builds the PUT payload', () => {
		const input = toGuidebookInput(guidebook)
		expect(input).toHaveLength(guidebook.length)
		expect(input[1]).toEqual({
			guideEffectId: guidebook[1]!.effect.id,
			count: 1,
			displayValue: '100%',
			acquiredOrder: null,
			inherited: false,
			note: null
		})
	})
})

describe('filterGuideEffects', () => {
	const all = filterGuideEffects(catalogue, DEFAULT_GUIDE_EFFECT_FILTERS)

	it('returns everything ordered by rarity then id', () => {
		expect(all).toHaveLength(101)
		expect(all[0]!.rarity).toBe('unique')
		expect(all.at(-1)!.rarity).toBe('cursed')
		const uniques = all.filter((e) => e.rarity === 'unique').map((e) => e.granblueId)
		expect(uniques).toEqual([...uniques].sort((a, b) => a - b))
	})

	it('filters by rarity', () => {
		const rares = filterGuideEffects(catalogue, { ...DEFAULT_GUIDE_EFFECT_FILTERS, rarity: 'rare' })
		expect(rares).toHaveLength(51)
		expect(rares.every((e) => e.rarity === 'rare')).toBe(true)
	})

	it('filters by target type, with "everyone" for untargeted effects', () => {
		const f = DEFAULT_GUIDE_EFFECT_FILTERS
		expect(filterGuideEffects(catalogue, { ...f, target: 'race' })).toHaveLength(5)
		expect(filterGuideEffects(catalogue, { ...f, target: 'proficiency' })).toHaveLength(2)
		expect(filterGuideEffects(catalogue, { ...f, target: 'character' })).toHaveLength(3)
		expect(filterGuideEffects(catalogue, { ...f, target: 'everyone' })).toHaveLength(91)
	})

	it('filters stackable effects', () => {
		const result = filterGuideEffects(catalogue, {
			...DEFAULT_GUIDE_EFFECT_FILTERS,
			stackableOnly: true
		})
		expect(result.length).toBeGreaterThan(0)
		expect(result.every((e) => e.stackable)).toBe(true)
	})

	it('matches every word of the query, case-insensitively', () => {
		const result = filterGuideEffects(catalogue, {
			...DEFAULT_GUIDE_EFFECT_FILTERS,
			query: 'atk 20%'
		})
		expect(result.map((e) => e.granblueId)).toContain(1)
		expect(result.every((e) => /atk/i.test(e.name.en ?? '') && /20%/.test(e.name.en ?? ''))).toBe(
			true
		)
	})
})

describe('icons', () => {
	it('maps the game icon category to a placeholder category', () => {
		expect(guideEffectIconCategory(effect(1))).toBe('offence')
		const cursed = catalogue.find((e) => e.iconCategory === 4)!
		expect(guideEffectIconCategory(cursed)).toBe('cursed')
		expect(guideEffectIconCategory({ ...effect(1), iconCategory: 9 })).toBe('special')
	})

	it('has no icon URLs yet', () => {
		expect(catalogue.every((e) => guideEffectIconSrc(e) === null)).toBe(true)
	})
})
