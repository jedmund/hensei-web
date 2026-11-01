import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import {
	getAwakeningImage,
	getAxSkillImage,
	getElementIcon,
	getElementLabelImage,
	getGenderLabelImage,
	getJobSkillIcon,
	getMasteryImage,
	getProficiencyLabelImage,
	getRaceLabelImage
} from '$lib/utils/images/icons'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// Job/Accessory images
// ============================================================================

describe('getJobSkillIcon', () => {
	it('returns default for undefined', () => {
		expect(getJobSkillIcon(undefined)).toBe('/images/icons/job-skills/default.png')
	})

	it('handles string input', () => {
		expect(getJobSkillIcon('rage-iv')).toBe('/images/icons/job-skills/rage-iv.png')
	})

	it('uses slug from object', () => {
		expect(getJobSkillIcon({ slug: 'miserable-mist' })).toBe(
			'/images/icons/job-skills/miserable-mist.png'
		)
	})

	it('returns default when object has no slug', () => {
		expect(getJobSkillIcon({})).toBe('/images/icons/job-skills/default.png')
	})
})

// ============================================================================
// Modification images
// ============================================================================

describe('getAwakeningImage', () => {
	it('returns awakening URL with default jpg', () => {
		expect(getAwakeningImage('attack')).toBe('/images/icons/awakening/attack.jpg')
	})

	it('supports png extension', () => {
		expect(getAwakeningImage('attack', 'png')).toBe('/images/icons/awakening/attack.png')
	})

	it('returns empty string for undefined', () => {
		expect(getAwakeningImage(undefined)).toBe('')
	})
})

describe('getAxSkillImage', () => {
	it('returns ax URL', () => {
		expect(getAxSkillImage('might')).toBe('/images/icons/ax-skills/might.png')
	})

	it('returns empty string for undefined', () => {
		expect(getAxSkillImage(undefined)).toBe('')
	})
})

describe('getMasteryImage', () => {
	it('returns mastery URL', () => {
		expect(getMasteryImage('atk')).toBe('/images/icons/mastery/atk.png?ids=game')
	})

	it('returns empty string for undefined', () => {
		expect(getMasteryImage(undefined)).toBe('')
	})
})

// ============================================================================
// Label images
// ============================================================================

describe('getElementLabelImage', () => {
	it('capitalizes element name', () => {
		expect(getElementLabelImage('fire')).toBe('/images/labels/element/Label_Element_Fire.png')
		expect(getElementLabelImage('WIND')).toBe('/images/labels/element/Label_Element_Wind.png')
	})
})

describe('getProficiencyLabelImage', () => {
	it('capitalizes proficiency name', () => {
		expect(getProficiencyLabelImage('sword')).toBe(
			'/images/labels/proficiency/Label_Weapon_Sword.png'
		)
	})
})

describe('getRaceLabelImage', () => {
	it('returns race label path', () => {
		expect(getRaceLabelImage('Human')).toBe('/images/labels/race/Label_Race_Human.png')
	})
})

describe('getGenderLabelImage', () => {
	it('replaces / with _ in gender label', () => {
		expect(getGenderLabelImage('Male/Female')).toBe(
			'/images/labels/gender/Label_Gender_Male_Female.png'
		)
	})

	it('handles simple label', () => {
		expect(getGenderLabelImage('Male')).toBe('/images/labels/gender/Label_Gender_Male.png')
	})
})

// ============================================================================
// Element icons
// ============================================================================

describe('getElementIcon', () => {
	it('maps element IDs to names', () => {
		expect(getElementIcon(1)).toBe('/images/icons/elements/element-fire.png')
		expect(getElementIcon(2)).toBe('/images/icons/elements/element-water.png')
		expect(getElementIcon(3)).toBe('/images/icons/elements/element-earth.png')
		expect(getElementIcon(4)).toBe('/images/icons/elements/element-wind.png')
		expect(getElementIcon(5)).toBe('/images/icons/elements/element-light.png')
		expect(getElementIcon(6)).toBe('/images/icons/elements/element-dark.png')
	})

	it('returns null element for unknown element', () => {
		expect(getElementIcon(99)).toBe('/images/icons/elements/element-null.png')
	})
})
