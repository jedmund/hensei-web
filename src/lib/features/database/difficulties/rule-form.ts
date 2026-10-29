export function formatTemplate(params: Record<string, unknown>): string {
	return JSON.stringify(params, null, 2)
}

export function needsTemplateConfirmation(text: string, generatedText: string | null): boolean {
	return generatedText === null || text !== generatedText
}

export function parseRuleParams(text: string): {
	params: Record<string, unknown> | null
	error: string | null
} {
	try {
		const params: unknown = JSON.parse(text)
		if (typeof params !== 'object' || params === null || Array.isArray(params)) {
			return { params: null, error: 'Params must be a JSON object.' }
		}
		return { params: params as Record<string, unknown>, error: null }
	} catch (err) {
		return { params: null, error: err instanceof Error ? err.message : 'Invalid JSON.' }
	}
}

export const weaponConditionOptions = [
	{ value: 'weapon_series_match', label: 'Weapon series' },
	{ value: 'weapon_transcendence_at_least', label: 'Weapon transcendence' },
	{ value: 'weapon_uncap_at_least', label: 'Weapon uncap' },
	{ value: 'weapon_awakening_at_least', label: 'Weapon awakening' }
]

const conditionKeys: Record<string, string[]> = {
	weapon_series_match: ['series_slugs', 'series_ids'],
	weapon_transcendence_at_least: ['min_transcendence_step', 'max_transcendence_step'],
	weapon_uncap_at_least: ['min_uncap_level', 'max_uncap_level'],
	weapon_awakening_at_least: ['min_awakening_level', 'max_awakening_level', 'awakening_id']
}

export function weaponConditions(params: Record<string, unknown>): string[] {
	return weaponConditionOptions
		.filter(({ value }) => conditionKeys[value]!.some((key) => Object.hasOwn(params, key)))
		.map(({ value }) => value)
}

export function toWeaponTier(
	type: string,
	params: Record<string, unknown>
): Record<string, unknown> | null {
	if (type === 'weapon_tier_match') return { ...params }
	if (!conditionKeys[type]) return null
	const tier = { ...params }
	if (type === 'weapon_series_match') {
		if (Object.hasOwn(tier, 'slugs')) {
			tier.series_slugs = tier.slugs
			delete tier.slugs
		}
	}
	if (type === 'weapon_transcendence_at_least') {
		tier.min_transcendence_step = tier.min_step
		delete tier.min_step
	}
	if (type === 'weapon_awakening_at_least') {
		tier.min_awakening_level = tier.min_level
		delete tier.min_level
	}
	return tier
}

export function replaceWeaponCondition(
	params: Record<string, unknown>,
	previous: string | null,
	next: string | null
): Record<string, unknown> {
	const result = { ...params }
	for (const key of conditionKeys[previous ?? ''] ?? []) delete result[key]
	if (next) {
		const defaults: Record<string, Record<string, unknown>> = {
			weapon_series_match: { series_slugs: [] },
			weapon_transcendence_at_least: { min_transcendence_step: 1 },
			weapon_uncap_at_least: { min_uncap_level: 1 },
			weapon_awakening_at_least: { min_awakening_level: 1 }
		}
		Object.assign(result, defaults[next])
	}
	return result
}
