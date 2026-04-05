import * as m from '$lib/paraglide/messages'

export function getRecencyOptions(): { value: number; label: string }[] {
	return [
		{ value: 86400, label: m.recency_day() },
		{ value: 604800, label: m.recency_week() },
		{ value: 2629746, label: m.recency_month() },
		{ value: 7889238, label: m.recency_3months() },
		{ value: 15778476, label: m.recency_6months() },
		{ value: 31556952, label: m.recency_year() }
	]
}

export function getPartyOptions(): { value: string; label: string }[] {
	return [
		{ value: 'full_auto', label: m.filter_full_auto() },
		{ value: 'solo', label: m.filter_solo() },
		{ value: 'auto_guard', label: m.filter_auto_guard() },
		{ value: 'charge_attack', label: m.filter_charge_attack() },
		{ value: 'youtube', label: m.filter_youtube() }
	]
}

export function getBoostOptions(): { value: string; label: string; aliases?: string[] }[] {
	return [
		{ value: 'omega', label: m.boost_omega(), aliases: ['magna'] },
		{ value: 'primal', label: m.boost_primal() },
		{ value: 'odious', label: m.boost_odious() },
		{ value: 'unboosted', label: m.boost_unboosted() }
	]
}

export function getSideOptions(): { value: string; label: string }[] {
	return [
		{ value: 'double', label: m.side_double() },
		{ value: 'single', label: m.side_single() }
	]
}

export function getRecencyLabel(value: number): string {
	return getRecencyOptions().find((o) => o.value === value)?.label ?? String(value)
}

export function getPartyLabel(value: string): string {
	return getPartyOptions().find((o) => o.value === value)?.label ?? value
}

export function getBoostLabel(value: string): string {
	return getBoostOptions().find((o) => o.value === value)?.label ?? value
}

export function getSideLabel(value: string): string {
	return getSideOptions().find((o) => o.value === value)?.label ?? value
}
