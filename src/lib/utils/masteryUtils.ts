import { overMastery, aetherialMastery, type ItemSkill } from '$lib/data/overMastery'
import { getElementName, getOppositeElement } from './element'

// Helper to find the right mastery category for rings
export function getRingMasteryCategory(modifier: number): ItemSkill[] {
	if (modifier <= 2) return overMastery.a // Primary (ATK, HP)
	if (modifier <= 9) return overMastery.b // Secondary
	return overMastery.c // Tertiary
}

// Helper to get ring stat
export function getRingStat(modifier: number): ItemSkill | undefined {
	const category = getRingMasteryCategory(modifier)
	return category.find(item => item.id === modifier)
}

// Helper to get earring stat
export function getEarringStat(modifier: number): ItemSkill | undefined {
	return aetherialMastery.find(item => item.id === modifier)
}

// Helper to get earring stat with element substitution
export function getElementalizedEarringStat(
	modifier: number,
	characterElement?: number,
	locale: 'en' | 'ja' = 'en'
): ItemSkill | undefined {
	const stat = getEarringStat(modifier)
	if (!stat) return undefined

	// Deep clone to avoid mutation
	const elementalizedStat = JSON.parse(JSON.stringify(stat)) as ItemSkill

	// Handle element substitution for IDs 3 and 4
	if (characterElement !== undefined && characterElement !== null) {
		if (modifier === 3) {
			// ID 3: Use character's element
			const elementName = getElementName(characterElement, locale)
			if (locale === 'en') {
				elementalizedStat.name.en = elementalizedStat.name.en.replace('{Element}', elementName)
			} else {
				elementalizedStat.name.ja = elementalizedStat.name.ja.replace('{属性}', `${elementName}属性`)
			}
			// Update slug for icon purposes - using element ID for icon path
			elementalizedStat.slug = `ele-${characterElement}`
		} else if (modifier === 4) {
			// ID 4: Use opposite element
			const oppositeElementId = getOppositeElement(characterElement)
			if (oppositeElementId !== undefined) {
				const elementName = getElementName(oppositeElementId, locale)
				if (locale === 'en') {
					elementalizedStat.name.en = elementalizedStat.name.en.replace('{Element}', elementName)
				} else {
					elementalizedStat.name.ja = elementalizedStat.name.ja.replace('{属性}', `${elementName}属性`)
				}
				// Update slug for icon purposes - using element ID for icon path
				elementalizedStat.slug = `ele-${oppositeElementId}`
			}
		}
	}

	return elementalizedStat
}