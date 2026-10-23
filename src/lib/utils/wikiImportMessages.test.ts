import { describe, it, expect } from 'vitest'
import { noteText, slotLabel, warningText } from './wikiImportMessages'
import type { WikiImportRequest } from '$lib/types/api/wikiImport'

const request: WikiImportRequest = {
	job: { name: 'Viking', accessory: 'Ouroboros Mino', skills: [null, null, null], fullAutoOff: [] },
	bullets: [],
	characters: [],
	weapons: [
		{ position: -1, title: 'Unsigned Kaneshige (Earth)', uncap: null, awakening: 'defense' },
		{ position: 1, title: 'Pillardriver', uncap: 't3', awakening: null }
	],
	keys: {},
	summons: [],
	quick: null
}

describe('slotLabel', () => {
	it.each([
		['weapon', -1, 'Mainhand'],
		['weapon', 0, 'Weapon 1'],
		['weapon', 11, 'Weapon 12'],
		['character', 0, 'Character 1'],
		['character', 7, 'Character 8'],
		['summon', -1, 'Main summon'],
		['summon', 6, 'Support summon'],
		['summon', 0, 'Summon 1'],
		['summon', 3, 'Summon 4'],
		['summon', 4, 'Sub summon 1'],
		['summon', 5, 'Sub summon 2'],
		['skill', 1, 'Subskill 1'],
		['skill', 3, 'Subskill 3']
	] as const)('names %s %i as %s', (kind, position, label) => {
		expect(slotLabel(kind, position)).toBe(label)
	})

	it('has no label for unknown or missing slots', () => {
		expect(slotLabel('weapon', 12)).toBeNull()
		expect(slotLabel('character', 8)).toBeNull()
		expect(slotLabel('summon', 7)).toBeNull()
		expect(slotLabel('skill', 0)).toBeNull()
		expect(slotLabel(undefined, 0)).toBeNull()
		expect(slotLabel('weapon', undefined)).toBeNull()
	})
})

describe('warningText', () => {
	it('names the awakening a weapon can not take, by slot', () => {
		expect(
			warningText(
				{
					code: 'awakening_not_allowed',
					detail: 'weapon -1',
					kind: 'weapon',
					position: -1,
					title: 'Unsigned Kaneshige'
				},
				request
			)
		).toBe("Mainhand: Unsigned Kaneshige can't take the Defense awakening")
	})

	it('names the class for subskills and accessories it can not use', () => {
		expect(
			warningText(
				{
					code: 'skill_not_allowed',
					detail: 'skill 2',
					kind: 'skill',
					position: 2,
					title: 'Secret Triad'
				},
				request
			)
		).toBe("Secret Triad can't be used with Viking")
		expect(
			warningText(
				{
					code: 'accessory_not_allowed',
					detail: '',
					kind: 'accessory',
					position: 0,
					title: 'Ouroboros Mino'
				},
				request
			)
		).toBe("Viking doesn't use Ouroboros Mino")
		expect(warningText({ code: 'skill_not_allowed', title: 'Secret Triad' }, null)).toBe(
			"Secret Triad can't be used with this class"
		)
	})

	it('says when an uncap was lowered', () => {
		expect(
			warningText(
				{
					code: 'uncap_clamped',
					detail: 'weapon 1',
					kind: 'weapon',
					position: 1,
					title: 'Pillardriver'
				},
				request
			)
		).toBe("Weapon 2: uncap lowered to the item's max")
	})

	it.each([
		['unknown_job', 'Class not found: Nope'],
		['unknown_skill', 'Subskill not found: Nope'],
		['unknown_accessory', 'Manatura or shield not found: Nope'],
		['unknown_key', 'Weapon key not found: Nope'],
		['unknown_bullet', 'Bullet not found: Nope'],
		['invalid_item', "Nope couldn't be added"],
		['element_not_changeable', "Nope's element can't be changed"],
		['invalid_position', "Nope can't go in this slot"],
		['slot_conflict', 'more than one item for this slot, so Nope was left out']
	])('reads %s', (code, text) => {
		expect(warningText({ code, title: 'Nope' }, request)).toBe(text)
	})

	it('falls back to a generic line with the slot and title for unknown codes', () => {
		expect(
			warningText(
				{ code: 'something_new', detail: 'x', kind: 'summon', position: 6, title: 'Lucifer' },
				request
			)
		).toBe('Support summon: Lucifer was skipped')
	})

	it('reads warnings in the old shape, with only a detail', () => {
		expect(warningText({ code: 'unknown_skill', detail: 'Secret Triad' }, request)).toBe(
			'Subskill not found: Secret Triad'
		)
		expect(warningText({ code: 'something_new', detail: 'weapon -1' }, request)).toBe(
			'weapon -1 was skipped'
		)
		expect(warningText({ code: 'something_new' }, request)).toBe('something_new was skipped')
	})
})

describe('noteText', () => {
	it('reads parser notes', () => {
		expect(noteText({ code: 'unknown_bullet', param: 'bullets', value: 'mystery' })).toBe(
			'Unknown bullet "mystery"'
		)
		expect(noteText({ code: 'multiple_grids' })).toBe('Only the first weapon grid is imported.')
	})
})
