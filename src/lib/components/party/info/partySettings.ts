import * as m from '$lib/paraglide/messages'

/** A party's battle settings and how it performed, as its info tile shows them */
export interface PartySettingsValues {
	chargeAttack?: boolean | undefined
	fullAuto?: boolean | undefined
	autoSummon?: boolean | undefined
	autoGuard?: boolean | undefined
	clearTime?: number | null | undefined
	buttonCount?: number | null | undefined
	chainCount?: number | null | undefined
	summonCount?: number | null | undefined
}

export interface BattleSetting {
	/** Also the chip's class, which colors it when on */
	key: 'chargeAttack' | 'fullAuto' | 'autoSummon' | 'autoGuard'
	label: string
	on: boolean
}

export interface Metric {
	label: string
	tooltip: string
}

/** Every battle setting, on or off; charge attack is on unless turned off */
export function battleSettings(values: PartySettingsValues): BattleSetting[] {
	const settings: [BattleSetting['key'], string, boolean][] = [
		['chargeAttack', m.battle_charge_attack(), values.chargeAttack ?? true],
		['fullAuto', m.battle_full_auto(), values.fullAuto ?? false],
		['autoSummon', m.battle_auto_summon(), values.autoSummon ?? false],
		['autoGuard', m.battle_auto_guard(), values.autoGuard ?? false]
	]
	return settings.map(([key, name, on]) => ({
		key,
		label: `${name} ${on ? m.battle_on() : m.battle_off()}`,
		on
	}))
}

/** Seconds as m:ss; null for none */
export function formatClearTime(seconds: number | null | undefined): string | null {
	if (seconds == null || seconds <= 0) return null
	const minutes = Math.floor(seconds / 60)
	return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`
}

/** The performance figures that were recorded: clear time, then button,
 * chain and summon counts */
export function performanceMetrics(values: PartySettingsValues): Metric[] {
	const count = (n: number | null | undefined, suffix: string) =>
		n == null ? null : `${n}${suffix}`
	const metrics: [string | null, string][] = [
		[formatClearTime(values.clearTime), m.party_edit_clear_time()],
		[count(values.buttonCount, 'B'), m.party_edit_button_count()],
		[count(values.chainCount, 'C'), m.party_edit_chain_count()],
		[count(values.summonCount, 'S'), m.party_edit_summon_count()]
	]
	return metrics.flatMap(([label, tooltip]) => (label === null ? [] : [{ label, tooltip }]))
}
