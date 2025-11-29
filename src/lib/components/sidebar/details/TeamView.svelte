<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import ModificationSection from '../modifications/ModificationSection.svelte'
	import UncapStatusDisplay from '../modifications/UncapStatusDisplay.svelte'
	import AwakeningDisplay from '../modifications/AwakeningDisplay.svelte'
	import MasteryDisplay from '../modifications/MasteryDisplay.svelte'
	import StatModifierItem from '../modifications/StatModifierItem.svelte'
	import WeaponKeysList from '../modifications/WeaponKeysList.svelte'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getElementLabel } from '$lib/utils/element'
	import { getRaceLabel } from '$lib/utils/race'
	import { getGenderLabel } from '$lib/utils/gender'
	import { getProficiencyLabel } from '$lib/utils/proficiency'
	import {
		formatAxSkill,
		getWeaponKeyTitle,
		getElementName
	} from '$lib/utils/modificationFormatters'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		itemData: any
		gridUncapLevel: number | null
		gridTranscendence: number | null
		modificationStatus: any
	}

	let { type, item, itemData, gridUncapLevel, gridTranscendence, modificationStatus }: Props =
		$props()
</script>

<div class="team-view">
	<ModificationSection title="Uncap & Transcendence" visible={true}>
		<UncapStatusDisplay
			{type}
			uncapLevel={gridUncapLevel}
			transcendenceStep={gridTranscendence}
			special={itemData?.special}
			flb={itemData?.uncap?.flb}
			ulb={itemData?.uncap?.ulb}
			transcendence={itemData?.uncap?.transcendence}
		/>
	</ModificationSection>

	{#if type === 'character'}
		{@const char = item as GridCharacter}

		{#if modificationStatus.hasAwakening}
			<ModificationSection title="Awakening" visible={true}>
				<AwakeningDisplay
					{...(char.awakening ? { awakening: char.awakening } : {})}
					size="medium"
					showLevel={true}
				/>
			</ModificationSection>
		{/if}

		{#if modificationStatus.hasRings || modificationStatus.hasEarring}
			<ModificationSection title="Mastery" visible={true}>
				<MasteryDisplay
					rings={char.overMastery}
					earring={char.aetherialMastery}
					characterElement={char.character?.element}
					variant="detailed"
					showIcons={true}
				/>
			</ModificationSection>
		{/if}

		{#if modificationStatus.hasPerpetuity}
			<ModificationSection title="Status" visible={true}>
				<StatModifierItem label="Perpetuity" value="Active" variant="max" />
			</ModificationSection>
		{/if}
	{:else if type === 'weapon'}
		{@const weapon = item as GridWeapon}

		{#if modificationStatus.hasAwakening && weapon.awakening}
			<ModificationSection title="Awakening" visible={true}>
				<AwakeningDisplay awakening={weapon.awakening} size="medium" showLevel={true} />
			</ModificationSection>
		{/if}

		{#if modificationStatus.hasWeaponKeys}
			<ModificationSection title={getWeaponKeyTitle(weapon.weapon?.series)} visible={true}>
				<WeaponKeysList weaponKeys={weapon.weaponKeys} weaponData={weapon.weapon} layout="list" />
			</ModificationSection>
		{/if}

		{#if modificationStatus.hasAxSkills && weapon.ax}
			<ModificationSection title="AX Skills" visible={true}>
				{#each weapon.ax as axSkill}
					<StatModifierItem
						label={formatAxSkill(axSkill).split('+')[0]?.trim() ?? ''}
						value={`+${axSkill.strength}`}
						suffix={axSkill.modifier <= 2 ? '' : '%'}
						variant="enhanced"
					/>
				{/each}
			</ModificationSection>
		{/if}

		{#if modificationStatus.hasElement && weapon.element}
			<ModificationSection title="Element Override" visible={true}>
				<StatModifierItem label="Instance Element" value={getElementName(weapon.element)} />
			</ModificationSection>
		{/if}
	{:else if type === 'summon'}
		{@const summon = item as GridSummon}

		{#if modificationStatus.hasQuickSummon || modificationStatus.hasFriendSummon}
			<ModificationSection title="Summon Status" visible={true}>
				{#if summon.quickSummon}
					<StatModifierItem label="Quick Summon" value="Enabled" variant="enhanced" />
				{/if}
				{#if summon.friend}
					<StatModifierItem label="Friend Summon" value="Yes" />
				{/if}
			</ModificationSection>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.team-view {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(spacing.$unit * 0.75) 0;
		border-bottom: 1px solid rgba(colors.$grey-70, 0.5);

		&:last-child {
			border-bottom: none;
		}

		.label {
			font-size: typography.$font-regular;
			color: var(--text-secondary, colors.$grey-50);
		}

		.value {
			font-size: typography.$font-regular;
			color: var(--text-primary, colors.$grey-10);
			font-weight: typography.$medium;
			text-align: right;
		}
	}
</style>
