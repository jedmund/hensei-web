/**
 * Icons and labels: job and character skills, awakenings, weapon skills, AX,
 * mastery, elements, element/proficiency/race/gender labels and profile icons
 */

import { getElementKey } from '$lib/utils/element'
import { BUCKET, getBasePath, renumberedImage } from '$lib/utils/images/core'

// ===== Job-Related Images =====

/**
 * Get job skill icon URL
 * Uses slug for the image path
 */
export function getJobSkillIcon(
	skill: { imageId?: string; slug?: string } | string | undefined
): string {
	if (!skill) return `${getBasePath()}/${BUCKET.jobSkills}/default.png`

	// Handle string input (backward compatibility)
	if (typeof skill === 'string') {
		return `${getBasePath()}/${BUCKET.jobSkills}/${skill}.png`
	}

	// Use slug for the image path
	if (skill.slug) {
		return `${getBasePath()}/${BUCKET.jobSkills}/${skill.slug}.png`
	}
	return `${getBasePath()}/${BUCKET.jobSkills}/default.png`
}

/**
 * Charge attacks (ougi) and support skills have no custom art, so they share a
 * static icon under icons/abilities keyed by slot kind.
 */
const STATIC_SKILL_ICONS: Record<string, string> = {
	ougi: 'charge-attack',
	support: 'support-skill'
}

/**
 * Get a character skill icon URL.
 *
 * Charge attacks and support skills use their shared static icon (they have no
 * per-skill art). Usable abilities use their game asset stem ("{id}_{N}", e.g.
 * "625_4"); when that stem is absent the function returns null so callers can fall
 * back to a type-color indicator.
 */
export function getCharacterSkillIcon(
	gameIcon: string | null | undefined,
	kind?: string | null
): string | null {
	const staticIcon = kind ? STATIC_SKILL_ICONS[kind] : undefined
	if (staticIcon) return `${getBasePath()}/${BUCKET.abilities}/${staticIcon}.png`
	if (!gameIcon) return null
	return `${getBasePath()}/${BUCKET.abilities}/${gameIcon}.png`
}

// ===== Modification Images =====

/**
 * Get awakening image URL
 */
export function getAwakeningImage(
	slug: string | undefined,
	extension: 'png' | 'jpg' = 'jpg'
): string {
	if (!slug) return ''
	return `${getBasePath()}/${BUCKET.awakening}/${slug}.${extension}`
}

/** An awakening's icon by slug: character awakenings are JPG, the rest PNG */
export function getAwakeningIcon(slug: string): string {
	return getAwakeningImage(slug, slug.startsWith('character-') ? 'jpg' : 'png')
}

/**
 * Get a weapon skill icon URL for the given locale. The stem (e.g.
 * "skill_atk_4_4") is the resolved, internal-element-numbered name the API
 * exposes as `iconStem`; EN and JA variants live in language subdirectories.
 */
/**
 * Get an in-game weapon-skill label badge URL (the "Weapon Skill Boosts"
 * panel tags), served from S3 with the rest of our images.
 */
export function getSkillLabelImage(
	slug: string | null | undefined,
	locale: string = 'en'
): string | null {
	if (!slug) return null
	const lang = locale === 'ja' ? 'ja' : 'en'
	return `${getBasePath()}/${BUCKET.skillLabels}/${lang}/${slug}.png`
}

export function getWeaponSkillIcon(
	stem: string | null | undefined,
	locale: string = 'en'
): string | null {
	if (!stem) return null
	const lang = locale === 'ja' ? 'ja' : 'en'
	return renumberedImage(`${getBasePath()}/${BUCKET.weaponSkills}/${lang}/${stem}.png`)
}

/**
 * Get AX skill image URL
 */
export function getAxSkillImage(slug: string | undefined): string {
	if (!slug) return ''
	return `${getBasePath()}/${BUCKET.axSkills}/${slug}.png`
}

/**
 * Get mastery image URL
 */
export function getMasteryImage(slug: string | undefined): string {
	if (!slug) return ''
	return renumberedImage(`${getBasePath()}/${BUCKET.mastery}/${slug}.png`)
}

// ===== Label Images =====

/**
 * Get element label image URL
 */
export function getElementLabelImage(elementName: string): string {
	const capitalizedLabel = elementName.charAt(0).toUpperCase() + elementName.slice(1).toLowerCase()
	return `${getBasePath()}/labels/element/Label_Element_${capitalizedLabel}.png`
}

/**
 * Get proficiency label image URL
 */
export function getProficiencyLabelImage(proficiencyName: string): string {
	const capitalizedLabel =
		proficiencyName.charAt(0).toUpperCase() + proficiencyName.slice(1).toLowerCase()
	return `${getBasePath()}/labels/proficiency/Label_Weapon_${capitalizedLabel}.png`
}

/**
 * Get race label image URL
 */
export function getRaceLabelImage(raceName: string): string {
	return `${getBasePath()}/labels/race/Label_Race_${raceName}.png`
}

/**
 * Get gender label image URL
 */
export function getGenderLabelImage(genderLabel: string): string {
	return `${getBasePath()}/labels/gender/Label_Gender_${genderLabel.replace('/', '_')}.png`
}

// ===== Element Icons =====

/**
 * Get element icon image URL (for select dropdowns, etc.)
 */
export function getElementIcon(element: number): string {
	const name = getElementKey(element)
	return `${getBasePath()}/${BUCKET.elements}/element-${name}.png`
}

/**
 * Get a profile/site-brand icon (e.g. gamewith.png, kamigame.png).
 * Uses S3/CDN base in production and the local static/images path in dev,
 * matching the rest of the image utilities. Pass the slug without extension.
 */
export function getProfileIcon(slug: string, ext: 'png' | 'svg' = 'png'): string {
	return `${getBasePath()}/profile/${slug}.${ext}`
}
