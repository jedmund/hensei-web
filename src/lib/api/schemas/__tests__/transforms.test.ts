import { describe, it, expect } from 'vitest'
import { snakeToCamel, camelToSnake, transformResponse, transformRequest } from '../transforms'

// ============================================================================
// snakeToCamel
// ============================================================================

describe('snakeToCamel', () => {
	it('converts simple keys', () => {
		expect(snakeToCamel({ first_name: 'Alice', last_name: 'Bob' })).toEqual({
			firstName: 'Alice',
			lastName: 'Bob'
		})
	})

	it('handles multi-underscore keys', () => {
		expect(snakeToCamel({ created_at_date: '2025' })).toEqual({ createdAtDate: '2025' })
	})

	it('handles nested objects', () => {
		expect(snakeToCamel({ user_data: { first_name: 'A' } })).toEqual({
			userData: { firstName: 'A' }
		})
	})

	it('handles arrays', () => {
		expect(snakeToCamel([{ skill_level: 1 }, { skill_level: 2 }])).toEqual([
			{ skillLevel: 1 },
			{ skillLevel: 2 }
		])
	})

	it('handles arrays inside objects', () => {
		expect(snakeToCamel({ my_list: [{ item_name: 'x' }] })).toEqual({
			myList: [{ itemName: 'x' }]
		})
	})

	it('passes through primitives', () => {
		expect(snakeToCamel('hello')).toBe('hello')
		expect(snakeToCamel(42)).toBe(42)
		expect(snakeToCamel(true)).toBe(true)
	})

	it('handles null and undefined', () => {
		expect(snakeToCamel(null)).toBeNull()
		expect(snakeToCamel(undefined)).toBeUndefined()
	})

	it('preserves already camelCase keys', () => {
		expect(snakeToCamel({ firstName: 'A' })).toEqual({ firstName: 'A' })
	})
})

// ============================================================================
// camelToSnake
// ============================================================================

describe('camelToSnake', () => {
	it('converts simple keys', () => {
		expect(camelToSnake({ firstName: 'Alice', lastName: 'Bob' })).toEqual({
			first_name: 'Alice',
			last_name: 'Bob'
		})
	})

	it('handles nested objects', () => {
		expect(camelToSnake({ userData: { firstName: 'A' } })).toEqual({
			user_data: { first_name: 'A' }
		})
	})

	it('handles arrays', () => {
		expect(camelToSnake([{ skillLevel: 1 }])).toEqual([{ skill_level: 1 }])
	})

	it('passes through primitives', () => {
		expect(camelToSnake('hello')).toBe('hello')
		expect(camelToSnake(42)).toBe(42)
	})

	it('handles null and undefined', () => {
		expect(camelToSnake(null)).toBeNull()
		expect(camelToSnake(undefined)).toBeUndefined()
	})

	it('preserves wiki_data/wikiData values as-is', () => {
		const input = { wikiData: { 'Page Name': { some_key: 'val' } } }
		const result = camelToSnake(input)
		// wikiData key gets converted to wiki_data, but value is not transformed
		expect(result).toHaveProperty('wiki_data')
		expect(result.wiki_data).toEqual({ 'Page Name': { some_key: 'val' } })
	})

	it('preserves wiki_data when key is already snake_case', () => {
		const input = { wiki_data: { 'Page/Name': { nested_key: 'v' } } }
		const result = camelToSnake(input)
		expect(result.wiki_data).toEqual({ 'Page/Name': { nested_key: 'v' } })
	})
})

// ============================================================================
// transformResponse
// ============================================================================

describe('transformResponse', () => {
	it('converts snake_case and renames object → entity', () => {
		const apiResponse = {
			id: 'party-1',
			user_id: 'u-1',
			weapons: [
				{ id: 'gw-1', position: 0, object: { id: 'w-1', weapon_name: 'Sword' } }
			],
			characters: [
				{ id: 'gc-1', position: 0, object: { id: 'c-1', char_name: 'Alice' } }
			],
			summons: [
				{ id: 'gs-1', position: 0, object: { id: 's-1', summon_name: 'Bahamut' } }
			]
		}

		const result = transformResponse<any>(apiResponse)

		// snake → camel
		expect(result.userId).toBe('u-1')

		// object → weapon
		expect(result.weapons[0].weapon).toBeDefined()
		expect(result.weapons[0].weapon.weaponName).toBe('Sword')
		expect(result.weapons[0].object).toBeUndefined()

		// object → character
		expect(result.characters[0].character).toBeDefined()
		expect(result.characters[0].character.charName).toBe('Alice')

		// object → summon
		expect(result.summons[0].summon).toBeDefined()
		expect(result.summons[0].summon.summonName).toBe('Bahamut')
	})

	it('handles non-entity arrays in weapons/characters/summons', () => {
		const input = {
			weapons: [{ id: 'w-1', name: 'plain' }] // no "object" key
		}
		const result = transformResponse<any>(input)
		expect(result.weapons[0].name).toBe('plain')
	})

	it('handles null/undefined', () => {
		expect(transformResponse(null)).toBeNull()
		expect(transformResponse(undefined)).toBeUndefined()
	})
})

// ============================================================================
// transformRequest
// ============================================================================

describe('transformRequest', () => {
	it('converts camelCase and renames entity → object', () => {
		const requestData = {
			userId: 'u-1',
			weapons: [
				{ id: 'gw-1', position: 0, weapon: { id: 'w-1', weaponName: 'Sword' } }
			],
			characters: [
				{ id: 'gc-1', position: 0, character: { id: 'c-1', charName: 'Alice' } }
			],
			summons: [
				{ id: 'gs-1', position: 0, summon: { id: 's-1', summonName: 'Bahamut' } }
			]
		}

		const result = transformRequest(requestData)

		// camel → snake
		expect(result.user_id).toBe('u-1')

		// weapon → object
		expect(result.weapons[0].object).toBeDefined()
		expect(result.weapons[0].object.weapon_name).toBe('Sword')
		expect(result.weapons[0].weapon).toBeUndefined()

		// character → object
		expect(result.characters[0].object).toBeDefined()
		expect(result.characters[0].object.char_name).toBe('Alice')

		// summon → object
		expect(result.summons[0].object).toBeDefined()
		expect(result.summons[0].object.summon_name).toBe('Bahamut')
	})

	it('handles null/undefined', () => {
		expect(transformRequest(null)).toBeNull()
		expect(transformRequest(undefined)).toBeUndefined()
	})
})

// ============================================================================
// Round-trip consistency
// ============================================================================

describe('round-trip', () => {
	it('transformResponse → transformRequest preserves structure', () => {
		const original = {
			party_id: 'p-1',
			weapons: [
				{ id: 'gw-1', main_hand: true, object: { id: 'w-1', weapon_type: 'sword' } }
			]
		}

		const toClient = transformResponse<any>(original)
		expect(toClient.partyId).toBe('p-1')
		expect(toClient.weapons[0].weapon.weaponType).toBe('sword')

		const toServer = transformRequest(toClient)
		expect(toServer.party_id).toBe('p-1')
		expect(toServer.weapons[0].object.weapon_type).toBe('sword')
	})
})
