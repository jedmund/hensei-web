import { describe, it, expect } from 'vitest'
import {
	ACCESSORY_TYPES,
	getAccessoryTypeName,
	getAccessoryTypeOptions,
	getJobAccessoryImageUrl
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

describe('getJobAccessoryImageUrl', () => {
	it('returns shield path for type 1', () => {
		expect(getJobAccessoryImageUrl('399001', 1)).toBe('/images/job-accessories/shield/399001.png')
	})

	it('returns manatura path for type 2', () => {
		expect(getJobAccessoryImageUrl('399002', 2)).toBe(
			'/images/job-accessories/manatura/399002.png'
		)
	})
})
