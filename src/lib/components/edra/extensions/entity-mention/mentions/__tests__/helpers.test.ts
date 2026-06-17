import { describe, it, expect } from 'vitest'
import { getBasePath } from '$lib/utils/images'
import {
	elementSlug,
	squareImageUrl,
	typeColorSwatch,
	mentionImageUrl,
	mentionHref,
	mentionChipAttrs,
	skillMentionSubheader,
	skillDescriptionLines
} from '../helpers'
import type { MentionToken } from '../types'

const base = getBasePath()

function characterToken(overrides: Partial<MentionToken> = {}): MentionToken {
	return {
		type: 'character',
		granblue_id: '3040001000',
		name: { en: 'Percival', ja: 'パーシヴァル' },
		element: { id: 2, slug: 'fire' },
		...overrides
	}
}

function skillToken(overrides: Partial<MentionToken['skill']> = {}): MentionToken {
	return {
		type: 'skill',
		granblue_id: 'skill-1',
		name: { en: 'Lord of Flames', ja: '焔の貴公子' },
		skill: {
			description: { en: 'Big fire damage.', ja: '' },
			gameIcon: '625_4',
			typeColor: 'damage',
			...overrides
		}
	}
}

describe('elementSlug', () => {
	it('reads the slug from an object element', () => {
		expect(elementSlug({ id: 2, slug: 'fire' })).toBe('fire')
	})
	it('maps a numeric element id to its slug', () => {
		expect(elementSlug(2)).toBe('fire')
		expect(elementSlug(0)).toBe('null')
	})
	it('falls back to null for unknown / missing values', () => {
		expect(elementSlug(undefined)).toBe('null')
		expect(elementSlug(null)).toBe('null')
		expect(elementSlug(99)).toBe('null')
		expect(elementSlug('fire')).toBe('null')
	})
})

describe('squareImageUrl', () => {
	it('builds the character portrait with the _01 suffix', () => {
		expect(squareImageUrl('character', '3040001000')).toBe(
			`${base}/characters/square/3040001000_01.jpg`
		)
	})
	it('builds weapon and summon square URLs', () => {
		expect(squareImageUrl('weapon', '1040001000')).toBe(`${base}/weapons/square/1040001000.jpg`)
		expect(squareImageUrl('summon', '2040001000')).toBe(`${base}/summons/square/2040001000.jpg`)
	})
	it('returns null for skills', () => {
		expect(squareImageUrl('skill', 'skill-1')).toBeNull()
	})
})

describe('typeColorSwatch', () => {
	it('maps known type colors to hex', () => {
		expect(typeColorSwatch('damage')).toBe('#d64545')
		expect(typeColorSwatch('buff')).toBe('#e0a93b')
	})
	it('returns null for unknown / missing colors', () => {
		expect(typeColorSwatch(null)).toBeNull()
		expect(typeColorSwatch(undefined)).toBeNull()
		expect(typeColorSwatch('rainbow')).toBeNull()
	})
})

describe('mentionImageUrl', () => {
	it('returns the square portrait for entities', () => {
		expect(mentionImageUrl(characterToken())).toBe(`${base}/characters/square/3040001000_01.jpg`)
	})
	it('returns the ability icon for a usable skill with a game icon', () => {
		expect(mentionImageUrl(skillToken({ slotKind: 'ability' }))).toBe(
			`${base}/icons/abilities/625_4.png`
		)
	})
	it('returns null for an ability skill without a game icon', () => {
		expect(mentionImageUrl(skillToken({ slotKind: 'ability', gameIcon: null }))).toBeNull()
	})
	it('returns the static charge-attack icon for ougi, ignoring gameIcon', () => {
		expect(mentionImageUrl(skillToken({ slotKind: 'ougi', gameIcon: null }))).toBe(
			`${base}/icons/abilities/charge-attack.png`
		)
	})
	it('returns the static support icon for support skills', () => {
		expect(mentionImageUrl(skillToken({ slotKind: 'support', gameIcon: null }))).toBe(
			`${base}/icons/abilities/support-skill.png`
		)
	})
})

describe('mentionHref', () => {
	it('links entities to gbf.wiki by English name', () => {
		expect(mentionHref(characterToken())).toBe('https://gbf.wiki/Percival')
	})
	it('encodes special characters in the wiki name', () => {
		expect(mentionHref(characterToken({ name: { en: 'Sandalphon (Summer)', ja: '' } }))).toBe(
			'https://gbf.wiki/Sandalphon%20(Summer)'
		)
	})
	it('returns null for skills (no wiki page)', () => {
		expect(mentionHref(skillToken())).toBeNull()
	})
	it('returns null for entities without an English name', () => {
		expect(mentionHref(characterToken({ name: { en: '', ja: 'x' } }))).toBeNull()
	})
})

describe('mentionChipAttrs', () => {
	it('emits type/element/entity-type for entities, no skill color', () => {
		expect(mentionChipAttrs(characterToken())).toEqual({
			'data-type': 'mention',
			'data-element': 'fire',
			'data-entity-type': 'character'
		})
	})
	it('adds data-skill-color for skills with a type color', () => {
		expect(mentionChipAttrs(skillToken())).toEqual({
			'data-type': 'mention',
			'data-element': 'null',
			'data-entity-type': 'skill',
			'data-skill-color': 'damage'
		})
	})
	it('omits data-skill-color when a skill has no type color', () => {
		expect(mentionChipAttrs(skillToken({ typeColor: null }))).not.toHaveProperty('data-skill-color')
	})
})

describe('skillMentionSubheader', () => {
	const character = { granblue_id: '3040001000', name: { en: 'Octavia', ja: 'オクタヴィア' } }

	it('appends the slot number for active (ability) skills', () => {
		expect(
			skillMentionSubheader(skillToken({ slotKind: 'ability', slotPosition: 2, character }))
		).toBe('Octavia 2')
	})

	it('shows just the character name for CAs and support skills', () => {
		expect(
			skillMentionSubheader(skillToken({ slotKind: 'ougi', slotPosition: 1, character }))
		).toBe('Octavia')
		expect(
			skillMentionSubheader(skillToken({ slotKind: 'support', slotPosition: 1, character }))
		).toBe('Octavia')
	})

	it('returns an empty string for non-skill tokens', () => {
		expect(skillMentionSubheader(characterToken())).toBe('')
	})
})

describe('skillDescriptionLines', () => {
	it('splits a multi-effect description on newlines', () => {
		expect(skillDescriptionLines('Deal damage.\nGain a buff.')).toEqual([
			'Deal damage.',
			'Gain a buff.'
		])
	})

	it('normalizes stray <br> literals (including the malformed "<br/ >")', () => {
		expect(skillDescriptionLines('At end of turn:<br/ >Consume charge.')).toEqual([
			'At end of turn:',
			'Consume charge.'
		])
	})

	it('trims lines and drops blank ones', () => {
		expect(skillDescriptionLines('  One \n\n  Two  \n')).toEqual(['One', 'Two'])
	})

	it('returns an empty array for an empty description', () => {
		expect(skillDescriptionLines('')).toEqual([])
	})
})
