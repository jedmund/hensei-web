import { getBasePath, getCharacterSkillIcon } from '$lib/utils/images'
import { localizedName } from '$lib/utils/locale'
import type { MentionToken } from './types'

/** Element ID → slug. The single copy (previously duplicated in EntityMention + EntityMentionList). */
const ELEMENT_SLUGS: Record<number, string> = {
	0: 'null',
	1: 'wind',
	2: 'fire',
	3: 'water',
	4: 'earth',
	5: 'dark',
	6: 'light'
}

/** Type color → swatch CSS, matching the Skills tab / Full Auto chips. */
const TYPE_COLOR_CSS: Record<string, string> = {
	damage: '#d64545',
	heal: '#3fa34d',
	buff: '#e0a93b',
	debuff: '#4a6fd6',
	field: '#8b5cf6'
}

/**
 * Resolves an element slug from any stored shape: a `{ slug }` object (token),
 * a numeric element id (search result), or undefined.
 */
export function elementSlug(element: unknown): string {
	if (element === null || element === undefined) return 'null'
	if (typeof element === 'object' && 'slug' in element) {
		return (element as { slug: string }).slug
	}
	if (typeof element === 'number') return ELEMENT_SLUGS[element] ?? 'null'
	return 'null'
}

/** Square portrait URL for an entity mention; null for skills (they use an icon instead). */
export function squareImageUrl(type: string, granblueId: string): string | null {
	const base = getBasePath()
	if (type === 'character') return `${base}/character-square/${granblueId}_01.jpg`
	if (type === 'weapon' || type === 'summon') return `${base}/${type}-square/${granblueId}.jpg`
	return null
}

/** Swatch background for a skill type color, or null when the color is unknown. */
export function typeColorSwatch(typeColor: string | null | undefined): string | null {
	if (!typeColor) return null
	return TYPE_COLOR_CSS[typeColor] ?? null
}

/** Thumbnail for a mention token: skill icon for skills, square portrait otherwise. */
export function mentionImageUrl(token: MentionToken): string | null {
	if (token.type === 'skill') return getCharacterSkillIcon(token.skill?.gameIcon)
	return squareImageUrl(token.type, token.granblue_id)
}

/** gbf.wiki link for a mention, or null when it should not link (skills have no wiki page). */
export function mentionHref(token: MentionToken): string | null {
	if (token.type === 'skill') return null
	const wikiName = token.name?.en
	if (!wikiName) return null
	return `https://gbf.wiki/${encodeURIComponent(wikiName)}`
}

/**
 * Attribution subheader for a skill mention: the owning character's name, plus the
 * slot number for active skills (e.g. "Octavia 2"), which is how players refer to them.
 * Returns '' for non-skill tokens or skills without an attributed character.
 */
export function skillMentionSubheader(token: MentionToken): string {
	const skill = token.skill
	if (!skill?.character) return ''
	const characterName = localizedName(skill.character.name)
	if (skill.slotKind === 'ability' && skill.slotPosition) {
		return `${characterName} ${skill.slotPosition}`
	}
	return characterName
}

/**
 * Splits a skill description into legible lines. Game descriptions separate effects
 * with newlines (and occasional stray `<br>` literals); this normalizes both into a
 * trimmed, blank-free list so the tooltip can render each as its own paragraph.
 */
export function skillDescriptionLines(text: string): string[] {
	return text
		.replace(/<br\s*\/?\s*>/gi, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line.length > 0)
}

/** The shared `data-*` chip attributes for both the editor node and the read-only renderer. */
export function mentionChipAttrs(token: MentionToken): Record<string, string> {
	const attrs: Record<string, string> = {
		'data-type': 'mention',
		'data-element': elementSlug(token.element),
		'data-entity-type': token.type
	}
	if (token.type === 'skill' && token.skill?.typeColor) {
		attrs['data-skill-color'] = token.skill.typeColor
	}
	return attrs
}
