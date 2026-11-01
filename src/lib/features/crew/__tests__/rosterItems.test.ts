import { describe, it, expect } from 'vitest'
import { getCharacterImage } from '$lib/utils/images/characters'
import { getWeaponImage } from '$lib/utils/images/weapons'
import { getSummonImage } from '$lib/utils/images/summons'
import type { EnrichedRosterItem, RosterItemRef } from '$lib/types/api/crew'
import {
	addRosterItem,
	getRosterItemImage,
	removeRosterItem,
	toSelectedItems
} from '../rosterItems'

const items: RosterItemRef[] = [
	{ id: '1', type: 'Character' },
	{ id: '1', type: 'Weapon' }
]

describe('addRosterItem', () => {
	it('appends a new item as a plain ref', () => {
		const result = addRosterItem(items, {
			id: '2',
			type: 'Summon',
			granblueId: '2040000000'
		} as RosterItemRef)
		expect(result).toEqual([...items, { id: '2', type: 'Summon' }])
	})

	it('treats the same id with another type as a new item', () => {
		expect(addRosterItem(items, { id: '1', type: 'Summon' })).toHaveLength(3)
	})

	it('returns null for an item already on the roster', () => {
		expect(addRosterItem(items, { id: '1', type: 'Weapon' })).toBeNull()
	})
})

describe('removeRosterItem', () => {
	it('removes only the item matching id and type', () => {
		expect(removeRosterItem(items, '1', 'Weapon')).toEqual([{ id: '1', type: 'Character' }])
		expect(removeRosterItem(items, '1', 'Summon')).toEqual(items)
	})
})

describe('toSelectedItems', () => {
	it('keeps the fields the roster shows', () => {
		const enriched: EnrichedRosterItem = {
			id: '1',
			type: 'Character',
			granblueId: '3040000000',
			name: 'Katalina',
			element: 3,
			season: null,
			uncap: { flb: true, transcendence: false },
			special: false
		}
		expect(toSelectedItems([enriched])).toEqual([
			{
				id: '1',
				type: 'Character',
				granblueId: '3040000000',
				name: 'Katalina',
				element: 3,
				season: null
			}
		])
	})
})

describe('getRosterItemImage', () => {
	it('uses the square image for each type', () => {
		expect(getRosterItemImage({ type: 'Character', granblueId: '3040000000' })).toBe(
			getCharacterImage('3040000000', 'square', '01')
		)
		expect(getRosterItemImage({ type: 'Weapon', granblueId: '1040000000' })).toBe(
			getWeaponImage('1040000000', 'square')
		)
		expect(getRosterItemImage({ type: 'Summon', granblueId: '2040000000' })).toBe(
			getSummonImage('2040000000', 'square')
		)
	})
})
