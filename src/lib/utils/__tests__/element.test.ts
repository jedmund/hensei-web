import { describe, it, expect, vi } from 'vitest'

vi.mock('$lib/utils/images', () => ({
	getBasePath: vi.fn(() => '/images')
}))

import {
	ELEMENTS,
	ELEMENT_LABELS,
	getElementLabel,
	getElementClass,
	getElementIcon,
	getElementOptions,
	getElementName,
	getOppositeElement,
	getElementImage
} from '../element'

// ============================================================================
// Constants
// ============================================================================

describe('ELEMENTS', () => {
	it('maps 0-6 with en/ja/opposite_id', () => {
		expect(ELEMENTS[0]!.en).toBe('Null')
		expect(ELEMENTS[1]!.ja).toBe('風')
		expect(ELEMENTS[2]!.opposite_id).toBe(3)
		expect(ELEMENTS[6]!.en).toBe('Light')
	})
})

// ============================================================================
// getElementLabel
// ============================================================================

describe('getElementLabel', () => {
	it('returns label for valid element', () => {
		expect(getElementLabel(1)).toBe('Wind')
		expect(getElementLabel(0)).toBe('Null')
	})

	it('returns dash for undefined/null', () => {
		expect(getElementLabel(undefined)).toBe('—')
		expect(getElementLabel(null as any)).toBe('—')
	})

	it('returns dash for unknown element', () => {
		expect(getElementLabel(99)).toBe('—')
	})
})

// ============================================================================
// getElementClass
// ============================================================================

describe('getElementClass', () => {
	it('returns lowercase CSS class', () => {
		expect(getElementClass(2)).toBe('element-fire')
		expect(getElementClass(5)).toBe('element-dark')
	})

	it('returns empty string for undefined/null', () => {
		expect(getElementClass(undefined)).toBe('')
		expect(getElementClass(null as any)).toBe('')
	})

	it('returns empty string for unknown', () => {
		expect(getElementClass(99)).toBe('')
	})
})

// ============================================================================
// getElementIcon
// ============================================================================

describe('getElementIcon', () => {
	it('returns label image path for valid element', () => {
		expect(getElementIcon(2)).toBe('/images/labels/element/Label_Element_Fire.png')
	})

	it('returns empty for undefined or Null element', () => {
		expect(getElementIcon(undefined)).toBe('')
		expect(getElementIcon(0)).toBe('')
	})
})

// ============================================================================
// getElementOptions
// ============================================================================

describe('getElementOptions', () => {
	it('returns all 7 options (0-6)', () => {
		const options = getElementOptions()
		expect(options).toHaveLength(7)
		expect(options[0]).toEqual({ value: 0, label: 'Null' })
		expect(options[6]).toEqual({ value: 6, label: 'Light' })
	})
})

// ============================================================================
// getElementName
// ============================================================================

describe('getElementName', () => {
	it('returns English name by default', () => {
		expect(getElementName(1)).toBe('Wind')
	})

	it('returns Japanese name', () => {
		expect(getElementName(2, 'ja')).toBe('火')
	})

	it('returns dash for undefined/null', () => {
		expect(getElementName(undefined)).toBe('—')
		expect(getElementName(null as any)).toBe('—')
	})

	it('returns dash for unknown', () => {
		expect(getElementName(99)).toBe('—')
	})
})

// ============================================================================
// getOppositeElement
// ============================================================================

describe('getOppositeElement', () => {
	it('returns opposite element pairs', () => {
		expect(getOppositeElement(1)).toBe(4) // Wind → Earth
		expect(getOppositeElement(4)).toBe(1) // Earth → Wind
		expect(getOppositeElement(2)).toBe(3) // Fire → Water
		expect(getOppositeElement(3)).toBe(2) // Water → Fire
		expect(getOppositeElement(5)).toBe(6) // Dark → Light
		expect(getOppositeElement(6)).toBe(5) // Light → Dark
	})

	it('returns 0 for Null element', () => {
		expect(getOppositeElement(0)).toBe(0)
	})

	it('returns undefined for undefined/null', () => {
		expect(getOppositeElement(undefined)).toBeUndefined()
		expect(getOppositeElement(null as any)).toBeUndefined()
	})
})

// ============================================================================
// getElementImage
// ============================================================================

describe('getElementImage', () => {
	it('returns element image path', () => {
		expect(getElementImage(2)).toBe('/images/elements/fire.png')
	})

	it('returns null element image', () => {
		expect(getElementImage(0)).toBe('/images/elements/null.png')
	})

	it('returns empty string for undefined/null', () => {
		expect(getElementImage(undefined)).toBe('')
		expect(getElementImage(null as any)).toBe('')
	})
})
