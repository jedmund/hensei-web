<script lang="ts">
	/**
	 * BattleSettingsSection - Switch toggles for battle settings
	 *
	 * Displays toggles for Full Auto, Auto Guard, Auto Summon, and Charge Attack.
	 */
	import * as m from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		fullAuto?: boolean
		autoGuard?: boolean
		autoSummon?: boolean
		chargeAttack?: boolean
		/** Element for switch color theming */
		element?: ElementType
		onchange?: (
			field: 'fullAuto' | 'autoGuard' | 'autoSummon' | 'chargeAttack',
			value: boolean
		) => void
		disabled?: boolean
	}

	let {
		fullAuto = $bindable(false),
		autoGuard = $bindable(false),
		autoSummon = $bindable(false),
		chargeAttack = $bindable(true),
		element,
		onchange,
		disabled = false
	}: Props = $props()

	function handleChange(
		field: 'fullAuto' | 'autoGuard' | 'autoSummon' | 'chargeAttack',
		value: boolean
	) {
		if (field === 'fullAuto') fullAuto = value
		else if (field === 'autoGuard') autoGuard = value
		else if (field === 'autoSummon') autoSummon = value
		else chargeAttack = value

		onchange?.(field, value)
	}
</script>

<DetailsSection title={m.section_battle_settings()}>
	<DetailRow label={m.battle_charge_attack()} noHover compact>
		{#snippet children()}
			<Switch
				checked={chargeAttack}
				size="small"
				{element}
				{disabled}
				onCheckedChange={(v) => handleChange('chargeAttack', v)}
			/>
		{/snippet}
	</DetailRow>

	<DetailRow label={m.battle_full_auto()} noHover compact>
		{#snippet children()}
			<Switch
				checked={fullAuto}
				size="small"
				{element}
				{disabled}
				onCheckedChange={(v) => handleChange('fullAuto', v)}
			/>
		{/snippet}
	</DetailRow>

	<DetailRow label={m.battle_auto_summon()} noHover compact>
		{#snippet children()}
			<Switch
				checked={autoSummon}
				size="small"
				{element}
				{disabled}
				onCheckedChange={(v) => handleChange('autoSummon', v)}
			/>
		{/snippet}
	</DetailRow>

	<DetailRow label={m.battle_auto_guard()} noHover compact>
		{#snippet children()}
			<Switch
				checked={autoGuard}
				size="small"
				{element}
				{disabled}
				onCheckedChange={(v) => handleChange('autoGuard', v)}
			/>
		{/snippet}
	</DetailRow>
</DetailsSection>
