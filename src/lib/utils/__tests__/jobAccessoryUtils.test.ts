import { describe, it, expect } from 'vitest'
import {
	ACCESSORY_TYPES,
	getAccessoryTypeName,
	getAccessoryTypeOptions
} from '../jobAccessoryUtils'

describe('ACCESSORY_TYPES', () => {
	it('defines shield and manatura', () => {
		expect(ACCESSORY_TYPES.SHIELD).toBe(1)
		expect(ACCESSORY_TYPES.MANATURA).toBe(2)
	})
})

describe('getAccessoryTypeName', () => {
	it('returns Shield for type 1', () => {
		expect(getAccessoryTypeName(1)).toBe('Shield')
	})

	it('returns Manatura for type 2', () => {
		expect(getAccessoryTypeName(2)).toBe('Manatura')
	})

	it('returns Unknown for invalid type', () => {
		expect(getAccessoryTypeName(99)).toBe('Unknown')
	})
})

describe('getAccessoryTypeOptions', () => {
	it('returns both options', () => {
		const options = getAccessoryTypeOptions()
		expect(options).toEqual([
			{ value: 1, label: 'Shield' },
			{ value: 2, label: 'Manatura' }
		])
	})
})

