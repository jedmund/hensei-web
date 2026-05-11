import { describe, expect, it } from 'vitest'
import {
	ICON_MAX_BYTES,
	ICON_MAX_DIMENSION,
	checkIconBytes,
	checkIconDimensions,
	checkIconMime,
	dataUrlToBase64
} from './iconUpload'

describe('checkIconMime', () => {
	it('accepts image/png', () => {
		expect(checkIconMime(new File([], 'icon.png', { type: 'image/png' }))).toBe(true)
	})

	it('rejects other image types', () => {
		expect(checkIconMime(new File([], 'icon.jpg', { type: 'image/jpeg' }))).toBe(false)
		expect(checkIconMime(new File([], 'icon.gif', { type: 'image/gif' }))).toBe(false)
		expect(checkIconMime(new File([], 'icon.webp', { type: 'image/webp' }))).toBe(false)
	})

	it('rejects empty / unknown mime', () => {
		expect(checkIconMime(new File([], 'icon.png', { type: '' }))).toBe(false)
		expect(checkIconMime(new File([], 'icon.png', { type: 'application/octet-stream' }))).toBe(
			false
		)
	})
})

describe('checkIconBytes', () => {
	it('accepts sizes at or below the cap', () => {
		expect(checkIconBytes(0)).toBe(true)
		expect(checkIconBytes(1024)).toBe(true)
		expect(checkIconBytes(ICON_MAX_BYTES)).toBe(true)
	})

	it('rejects sizes above the cap', () => {
		expect(checkIconBytes(ICON_MAX_BYTES + 1)).toBe(false)
		expect(checkIconBytes(ICON_MAX_BYTES * 10)).toBe(false)
	})
})

describe('checkIconDimensions', () => {
	it('accepts dimensions at or below the cap', () => {
		expect(checkIconDimensions(1, 1)).toBe(true)
		expect(checkIconDimensions(64, 64)).toBe(true)
		expect(checkIconDimensions(ICON_MAX_DIMENSION, ICON_MAX_DIMENSION)).toBe(true)
	})

	it('rejects if either dimension exceeds the cap', () => {
		expect(checkIconDimensions(ICON_MAX_DIMENSION + 1, ICON_MAX_DIMENSION)).toBe(false)
		expect(checkIconDimensions(ICON_MAX_DIMENSION, ICON_MAX_DIMENSION + 1)).toBe(false)
		expect(checkIconDimensions(512, 512)).toBe(false)
	})
})

describe('dataUrlToBase64', () => {
	it('strips the PNG data-URL prefix', () => {
		expect(dataUrlToBase64('data:image/png;base64,iVBORw0KGgo=')).toBe('iVBORw0KGgo=')
	})

	it('strips other image mime prefixes', () => {
		expect(dataUrlToBase64('data:image/jpeg;base64,/9j/4AAQ')).toBe('/9j/4AAQ')
	})

	it('leaves a raw base64 string alone if there is no prefix', () => {
		expect(dataUrlToBase64('iVBORw0KGgo=')).toBe('iVBORw0KGgo=')
	})
})
