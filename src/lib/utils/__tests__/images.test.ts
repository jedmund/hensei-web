import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('$lib/api/adapters/config', () => ({
	getImageBaseUrl: vi.fn(() => '')
}))

import { getImageBaseUrl } from '$lib/api/adapters/config'
import {
	getBasePath,
	getPlaceholderImage,
	getGenericPlaceholder,
	getCharacterPose,
	getImageUrl,
	getCharacterImage,
	getCharacterDetailImage,
	getWeaponImage,
	getWeaponBaseImage,
	getSummonImage,
	getSummonDetailImage,
	getSummonWideImage,
	getCharacterImageWithPose,
	getWeaponGridImage,
	getJobSkillIcon,
	getAccessoryImage,
	getAwakeningImage,
	getWeaponKeyImage,
	getAxSkillImage,
	getMasteryImage,
	getElementLabelImage,
	getProficiencyLabelImage,
	getRaceLabelImage,
	getGenderLabelImage,
	getElementIcon,
	getArtifactImage,
	getGameCdnCharacterImage,
	getGameCdnWeaponImage,
	getGameCdnSummonImage,
	getGuidebookImage,
	getRaidImage,
	getRaidCdnImage
} from '../images'

const mockedGetImageBaseUrl = vi.mocked(getImageBaseUrl)

beforeEach(() => {
	mockedGetImageBaseUrl.mockReturnValue('')
})

// ============================================================================
// getBasePath
// ============================================================================

describe('getBasePath', () => {
	it('returns /images when no remote URL configured', () => {
		expect(getBasePath()).toBe('/images')
	})

	it('returns remote URL when configured', () => {
		mockedGetImageBaseUrl.mockReturnValue('https://cdn.example.com')
		expect(getBasePath()).toBe('https://cdn.example.com')
	})
})

// ============================================================================
// Placeholders
// ============================================================================

describe('getPlaceholderImage', () => {
	it('returns placeholder path for each type/variant combo', () => {
		expect(getPlaceholderImage('character', 'grid')).toBe(
			'/images/placeholders/placeholder-character-grid.png'
		)
		expect(getPlaceholderImage('weapon', 'main')).toBe(
			'/images/placeholders/placeholder-weapon-main.png'
		)
		expect(getPlaceholderImage('summon', 'square')).toBe(
			'/images/placeholders/placeholder-summon-square.png'
		)
	})
})

describe('getGenericPlaceholder', () => {
	it('returns weapon-grid placeholder', () => {
		expect(getGenericPlaceholder()).toBe('/images/placeholders/placeholder-weapon-grid.png')
	})
})

// ============================================================================
// getCharacterPose
// ============================================================================

describe('getCharacterPose', () => {
	it('returns 01 with no args', () => {
		expect(getCharacterPose()).toBe('01')
	})

	it('returns 01 for uncap <= 2', () => {
		expect(getCharacterPose(0)).toBe('01')
		expect(getCharacterPose(1)).toBe('01')
		expect(getCharacterPose(2)).toBe('01')
	})

	it('returns 02 for uncap 3-4', () => {
		expect(getCharacterPose(3)).toBe('02')
		expect(getCharacterPose(4)).toBe('02')
	})

	it('returns 03 for uncap >= 5', () => {
		expect(getCharacterPose(5)).toBe('03')
		expect(getCharacterPose(6)).toBe('03')
	})

	it('returns 04 for transcendence > 0', () => {
		expect(getCharacterPose(5, 1)).toBe('04')
		expect(getCharacterPose(6, 3)).toBe('04')
	})

	it('transcendence 0 does not trigger 04', () => {
		expect(getCharacterPose(5, 0)).toBe('03')
	})
})

// ============================================================================
// getSummonTransformation
// ============================================================================

import { getSummonTransformation, getWeaponTransformation } from '../images'

describe('getSummonTransformation', () => {
	const PRIMAL_SUMMON = '2040094000' // Agni (first upgrade at uncap 5)
	const OMEGA_SUMMON = '2040020000' // Tiamat Omega (first upgrade at uncap 4)

	it('returns undefined for summons not in the alt art set', () => {
		expect(getSummonTransformation('9999999999', 5)).toBeUndefined()
	})

	it('returns undefined for null/undefined id', () => {
		expect(getSummonTransformation(null, 5)).toBeUndefined()
		expect(getSummonTransformation(undefined, 5)).toBeUndefined()
	})

	it('returns undefined for base uncap (below threshold)', () => {
		expect(getSummonTransformation(PRIMAL_SUMMON, 4)).toBeUndefined()
		expect(getSummonTransformation(OMEGA_SUMMON, 3)).toBeUndefined()
	})

	it('returns 02 for first upgrade (at per-summon threshold)', () => {
		// Primal: threshold 5
		expect(getSummonTransformation(PRIMAL_SUMMON, 5)).toBe('02')
		expect(getSummonTransformation(PRIMAL_SUMMON, 5, 0)).toBe('02')
		// Omega: threshold 4
		expect(getSummonTransformation(OMEGA_SUMMON, 4)).toBe('02')
		expect(getSummonTransformation(OMEGA_SUMMON, 5)).toBe('02')
		expect(getSummonTransformation(OMEGA_SUMMON, 5, 0)).toBe('02')
	})

	it('returns 03 for second upgrade (uncap 6)', () => {
		expect(getSummonTransformation(PRIMAL_SUMMON, 6)).toBe('03')
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 0)).toBe('03')
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 4)).toBe('03')
		expect(getSummonTransformation(OMEGA_SUMMON, 6)).toBe('03')
		expect(getSummonTransformation(OMEGA_SUMMON, 6, 4)).toBe('03')
	})

	it('returns 04 for third upgrade (uncap 6 + transcendence 5)', () => {
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 5)).toBe('04')
		expect(getSummonTransformation(PRIMAL_SUMMON, 6, 6)).toBe('04')
		expect(getSummonTransformation(OMEGA_SUMMON, 6, 5)).toBe('04')
	})

	it('accepts numeric id', () => {
		expect(getSummonTransformation(2040094000, 5)).toBe('02')
	})
})

// ============================================================================
// getWeaponTransformation
// ============================================================================

describe('getWeaponTransformation', () => {
	it('returns undefined when weapon has no transcendence', () => {
		expect(getWeaponTransformation(false, 5, 0)).toBeUndefined()
	})

	it('returns undefined when uncap level is not 6', () => {
		expect(getWeaponTransformation(true, 5, 1)).toBeUndefined()
	})

	it('returns 02 for transcendence steps 1-4', () => {
		expect(getWeaponTransformation(true, 6, 1)).toBe('02')
		expect(getWeaponTransformation(true, 6, 4)).toBe('02')
	})

	it('returns 03 for transcendence step 5', () => {
		expect(getWeaponTransformation(true, 6, 5)).toBe('03')
	})

	it('returns undefined at uncap 6 with no transcendence steps', () => {
		expect(getWeaponTransformation(true, 6, 0)).toBeUndefined()
		expect(getWeaponTransformation(true, 6)).toBeUndefined()
	})
})

// ============================================================================
// getImageUrl
// ============================================================================

describe('getImageUrl', () => {
	it('returns placeholder when id is null/undefined', () => {
		expect(getImageUrl('character', null, 'grid')).toBe(
			'/images/placeholders/placeholder-character-grid.png'
		)
		expect(getImageUrl('weapon', undefined, 'main')).toBe(
			'/images/placeholders/placeholder-weapon-main.png'
		)
	})

	it('returns character URL with pose', () => {
		expect(getImageUrl('character', '3040001', 'main', { pose: '02' })).toBe(
			'/images/character-main/3040001_02.jpg'
		)
	})

	it('defaults character pose to 01', () => {
		expect(getImageUrl('character', '3040001', 'grid')).toBe(
			'/images/character-grid/3040001_01.jpg'
		)
	})

	it('returns weapon URL without element', () => {
		expect(getImageUrl('weapon', '1040001', 'main')).toBe('/images/weapon-main/1040001.jpg')
	})

	it('returns weapon grid URL with element suffix', () => {
		expect(getImageUrl('weapon', '1040001', 'grid', { element: 3 })).toBe(
			'/images/weapon-grid/1040001_3.jpg'
		)
	})

	it('weapon grid element 0 is valid', () => {
		expect(getImageUrl('weapon', '1040001', 'grid', { element: 0 })).toBe(
			'/images/weapon-grid/1040001_0.jpg'
		)
	})

	it('returns summon URL', () => {
		expect(getImageUrl('summon', '2040001', 'main')).toBe('/images/summon-main/2040001.jpg')
	})

	describe('file extensions', () => {
		it('uses .png for character-detail', () => {
			expect(getImageUrl('character', '3040001', 'detail', { pose: '01' })).toMatch(/\.png$/)
		})

		it('uses .png for weapon-base', () => {
			expect(getImageUrl('weapon', '1040001', 'base')).toMatch(/\.png$/)
		})

		it('uses .png for summon-detail', () => {
			expect(getImageUrl('summon', '2040001', 'detail')).toMatch(/\.png$/)
		})

		it('uses .jpg for everything else', () => {
			expect(getImageUrl('character', '3040001', 'grid')).toMatch(/\.jpg$/)
			expect(getImageUrl('weapon', '1040001', 'main')).toMatch(/\.jpg$/)
			expect(getImageUrl('summon', '2040001', 'grid')).toMatch(/\.jpg$/)
		})
	})
})

// ============================================================================
// Convenience functions
// ============================================================================

describe('getCharacterImage', () => {
	it('defaults to main variant', () => {
		expect(getCharacterImage('3040001')).toBe('/images/character-main/3040001_01.jpg')
	})

	it('accepts pose override', () => {
		expect(getCharacterImage('3040001', 'grid', '03')).toBe(
			'/images/character-grid/3040001_03.jpg'
		)
	})

	it('returns placeholder for null', () => {
		expect(getCharacterImage(null)).toContain('placeholder')
	})
})

describe('getCharacterDetailImage', () => {
	it('returns detail PNG', () => {
		expect(getCharacterDetailImage('3040001', '02')).toBe(
			'/images/character-detail/3040001_02.png'
		)
	})
})

describe('getWeaponImage', () => {
	it('defaults to main variant', () => {
		expect(getWeaponImage('1040001')).toBe('/images/weapon-main/1040001.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getWeaponImage(null)).toContain('placeholder')
	})

	it('adds element suffix for grid variant', () => {
		expect(getWeaponImage('1040001', 'grid', 2)).toBe('/images/weapon-grid/1040001_2.jpg')
	})

	it('element 0 produces _0 suffix', () => {
		expect(getWeaponImage('1040001', 'grid', 0)).toBe('/images/weapon-grid/1040001_0.jpg')
	})

	it('adds transformation suffix', () => {
		expect(getWeaponImage('1040001', 'main', undefined, '02')).toBe(
			'/images/weapon-main/1040001_02.jpg'
		)
	})
})

describe('getWeaponBaseImage', () => {
	it('returns base PNG', () => {
		expect(getWeaponBaseImage('1040001')).toBe('/images/weapon-base/1040001.png')
	})
})

describe('getSummonImage', () => {
	it('defaults to main', () => {
		expect(getSummonImage('2040001')).toBe('/images/summon-main/2040001.jpg')
	})

	it('adds transformation suffix', () => {
		expect(getSummonImage('2040001', 'main', '02')).toBe('/images/summon-main/2040001_02.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getSummonImage(null)).toContain('placeholder')
	})
})

describe('getSummonDetailImage', () => {
	it('returns detail PNG', () => {
		expect(getSummonDetailImage('2040001')).toBe('/images/summon-detail/2040001.png')
	})
})

describe('getSummonWideImage', () => {
	it('returns wide JPG', () => {
		expect(getSummonWideImage('2040001')).toBe('/images/summon-wide/2040001.jpg')
	})
})

// ============================================================================
// Special handlers
// ============================================================================

describe('getCharacterImageWithPose', () => {
	it('returns placeholder for null id', () => {
		expect(getCharacterImageWithPose(null, 'grid')).toContain('placeholder')
	})

	it('calculates pose from uncap/transcendence', () => {
		expect(getCharacterImageWithPose('3040001', 'main', 3)).toBe(
			'/images/character-main/3040001_02.jpg'
		)
		expect(getCharacterImageWithPose('3040001', 'main', 5)).toBe(
			'/images/character-main/3040001_03.jpg'
		)
		expect(getCharacterImageWithPose('3040001', 'main', 5, 1)).toBe(
			'/images/character-main/3040001_04.jpg'
		)
	})

	it('handles Gran/Djeeta (3030182000) with element suffix', () => {
		const url = getCharacterImageWithPose('3030182000', 'main', 3, 0, 2, null)
		expect(url).toBe('/images/character-main/3030182000_02_02.jpg')
	})

	it('Gran/Djeeta falls back to partyElement then 1', () => {
		const withParty = getCharacterImageWithPose('3030182000', 'main', 0, 0, null, 5)
		expect(withParty).toContain('_01_05')

		const noElement = getCharacterImageWithPose('3030182000', 'main', 0, 0, null, null)
		expect(noElement).toContain('_01_01')
	})
})

describe('getWeaponGridImage', () => {
	it('returns grid URL without element for normal weapons', () => {
		expect(getWeaponGridImage('1040001')).toBe('/images/weapon-grid/1040001.jpg')
	})

	it('handles element-changeable weapons (element === 0) with instance element', () => {
		expect(getWeaponGridImage('1040001', 0, 3)).toBe('/images/weapon-grid/1040001_3.jpg')
	})

	it('element-changeable without instanceElement defaults to 0', () => {
		expect(getWeaponGridImage('1040001', 0)).toBe('/images/weapon-grid/1040001_0.jpg')
	})

	it('returns placeholder for null id', () => {
		expect(getWeaponGridImage(null)).toContain('placeholder')
	})
})

// ============================================================================
// Job/Accessory images
// ============================================================================

describe('getJobSkillIcon', () => {
	it('returns default for undefined', () => {
		expect(getJobSkillIcon(undefined)).toBe('/images/job-skills/default.png')
	})

	it('handles string input', () => {
		expect(getJobSkillIcon('rage-iv')).toBe('/images/job-skills/rage-iv.png')
	})

	it('uses slug from object', () => {
		expect(getJobSkillIcon({ slug: 'miserable-mist' })).toBe(
			'/images/job-skills/miserable-mist.png'
		)
	})

	it('returns default when object has no slug', () => {
		expect(getJobSkillIcon({})).toBe('/images/job-skills/default.png')
	})
})

describe('getAccessoryImage', () => {
	it('returns accessory URL', () => {
		expect(getAccessoryImage('399001')).toBe('/images/accessory-square/399001.jpg')
	})

	it('returns generic placeholder for undefined', () => {
		expect(getAccessoryImage(undefined)).toContain('placeholder')
	})
})

// ============================================================================
// Modification images
// ============================================================================

describe('getAwakeningImage', () => {
	it('returns awakening URL with default jpg', () => {
		expect(getAwakeningImage('attack')).toBe('/images/awakening/attack.jpg')
	})

	it('supports png extension', () => {
		expect(getAwakeningImage('attack', 'png')).toBe('/images/awakening/attack.png')
	})

	it('returns empty string for undefined', () => {
		expect(getAwakeningImage(undefined)).toBe('')
	})
})

describe('getWeaponKeyImage', () => {
	it('returns key image using slug directly', () => {
		expect(getWeaponKeyImage('alpha')).toBe('/images/weapon-keys/alpha.png')
		expect(getWeaponKeyImage('pendulum')).toBe('/images/weapon-keys/pendulum.png')
		expect(getWeaponKeyImage('elemental-teluma')).toBe('/images/weapon-keys/elemental-teluma.png')
	})
})

describe('getAxSkillImage', () => {
	it('returns ax URL', () => {
		expect(getAxSkillImage('might')).toBe('/images/ax/might.png')
	})

	it('returns empty string for undefined', () => {
		expect(getAxSkillImage(undefined)).toBe('')
	})
})

describe('getMasteryImage', () => {
	it('returns mastery URL', () => {
		expect(getMasteryImage('atk')).toBe('/images/mastery/atk.png')
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
		expect(getElementIcon(1)).toBe('/images/elements/element-wind.png')
		expect(getElementIcon(2)).toBe('/images/elements/element-fire.png')
		expect(getElementIcon(3)).toBe('/images/elements/element-water.png')
		expect(getElementIcon(4)).toBe('/images/elements/element-earth.png')
		expect(getElementIcon(5)).toBe('/images/elements/element-dark.png')
		expect(getElementIcon(6)).toBe('/images/elements/element-light.png')
	})

	it('returns null element for unknown element', () => {
		expect(getElementIcon(99)).toBe('/images/elements/element-null.png')
	})
})

// ============================================================================
// Artifact images
// ============================================================================

describe('getArtifactImage', () => {
	it('returns square by default', () => {
		expect(getArtifactImage('500001')).toBe('/images/artifact-square/500001.jpg')
	})

	it('returns wide variant', () => {
		expect(getArtifactImage('500001', 'wide')).toBe('/images/artifact-wide/500001.jpg')
	})

	it('returns generic placeholder for null', () => {
		expect(getArtifactImage(null)).toContain('placeholder')
	})
})

// ============================================================================
// Game CDN images
// ============================================================================

describe('getGameCdnCharacterImage', () => {
	it('returns CDN URL with pose', () => {
		expect(getGameCdnCharacterImage('3040001')).toContain('npc/s/3040001_01.jpg')
	})

	it('accepts custom pose', () => {
		expect(getGameCdnCharacterImage('3040001', '03')).toContain('npc/s/3040001_03.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getGameCdnCharacterImage(null)).toContain('placeholder')
	})
})

describe('getGameCdnWeaponImage', () => {
	it('returns CDN URL', () => {
		expect(getGameCdnWeaponImage('1040001')).toContain('weapon/s/1040001.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getGameCdnWeaponImage(null)).toContain('placeholder')
	})
})

describe('getGameCdnSummonImage', () => {
	it('returns CDN URL', () => {
		expect(getGameCdnSummonImage('2040001')).toContain('summon/s/2040001.jpg')
	})

	it('returns placeholder for null', () => {
		expect(getGameCdnSummonImage(null)).toContain('placeholder')
	})
})

// ============================================================================
// Other game images
// ============================================================================

describe('getGuidebookImage', () => {
	it('returns guidebook URL', () => {
		expect(getGuidebookImage('101')).toBe('/images/guidebooks/book_101.png')
	})

	it('returns generic placeholder for undefined', () => {
		expect(getGuidebookImage(undefined)).toContain('placeholder')
	})
})

// ============================================================================
// Raid images
// ============================================================================

describe('getRaidImage', () => {
	it('returns stored raid image by variant', () => {
		expect(getRaidImage('proto-bahamut', 'icon')).toContain(
			'/images/raid-icon/proto-bahamut.png'
		)
		expect(getRaidImage('proto-bahamut', 'thumbnail')).toContain(
			'/images/raid-thumbnail/proto-bahamut.png'
		)
	})

	it('defaults to thumbnail', () => {
		expect(getRaidImage('proto-bahamut')).toContain('/images/raid-thumbnail/proto-bahamut.png')
	})

	it('includes cache-busting query parameter', () => {
		expect(getRaidImage('proto-bahamut')).toMatch(/\?v=\d+$/)
	})

	it('returns generic placeholder for undefined', () => {
		expect(getRaidImage(undefined)).toContain('placeholder')
	})
})

describe('getRaidCdnImage', () => {
	it('returns icon from enemy CDN', () => {
		expect(getRaidCdnImage('icon', 12345)).toContain('/enemy/m/12345.png')
	})

	it('returns thumbnail with _high suffix', () => {
		expect(getRaidCdnImage('thumbnail', 12345)).toContain('/summon/qm/12345_high.png')
	})

	it('returns lobby with 1 suffix', () => {
		expect(getRaidCdnImage('lobby', 12345)).toContain('/lobby/123451.png')
	})

	it('returns background with raid_image_new path', () => {
		expect(getRaidCdnImage('background', 12345)).toContain('/12345/raid_image_new.png')
	})

	it('returns generic placeholder for undefined id', () => {
		expect(getRaidCdnImage('icon', undefined)).toContain('placeholder')
	})
})

// ============================================================================
// Remote URL integration
// ============================================================================

describe('with remote base URL', () => {
	beforeEach(() => {
		mockedGetImageBaseUrl.mockReturnValue('https://cdn.example.com')
	})

	it('prefixes all paths with remote URL', () => {
		expect(getCharacterImage('3040001')).toMatch(/^https:\/\/cdn\.example\.com\//)
		expect(getWeaponImage('1040001')).toMatch(/^https:\/\/cdn\.example\.com\//)
		expect(getSummonImage('2040001')).toMatch(/^https:\/\/cdn\.example\.com\//)
		expect(getPlaceholderImage('character', 'grid')).toMatch(/^https:\/\/cdn\.example\.com\//)
	})
})
