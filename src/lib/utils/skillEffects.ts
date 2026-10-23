import type { CharacterSkillEffect } from '$lib/types/api/entities'
import { appLocale, type AppLocale } from '$lib/utils/locale'

/**
 * The name to show for a skill effect's status: the skill's own name for it
 * (`label`, e.g. "Guilty Break" on a Jammed effect) when it has one, else the
 * status's name. Labels are English only for now, so Japanese shows the linked
 * status's Japanese name. Links and filters still use `effect.status`.
 */
export function effectStatusName(
	effect: Pick<CharacterSkillEffect, 'label' | 'status'>,
	locale: AppLocale = appLocale()
): string | undefined {
	const name = effect.status?.name
	if (locale === 'ja') return name?.ja || effect.label || name?.en || undefined

	return effect.label || name?.en || name?.ja || undefined
}
