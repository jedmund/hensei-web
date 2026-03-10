<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import AwakeningDisplay from '../modifications/AwakeningDisplay.svelte'
	import MasteryDisplay from '../modifications/MasteryDisplay.svelte'
	import WeaponKeysList from '../modifications/WeaponKeysList.svelte'
	import ArtifactSummary from '../modifications/ArtifactSummary.svelte'
	import { formatAxSkill, getWeaponKeyTitle } from '$lib/utils/modificationFormatters'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

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

	// Get uncap capabilities from item data based on type
	let uncapCaps = $derived.by(() => {
		if (type === 'character') {
			const char = item as GridCharacter
			const uncap = char.character?.uncap
			return { flb: uncap?.flb, ulb: uncap?.ulb, transcendence: false }
		} else if (type === 'weapon') {
			const weapon = item as GridWeapon
			const uncap = weapon.weapon?.uncap
			return { flb: uncap?.flb, ulb: uncap?.ulb, transcendence: uncap?.transcendence }
		} else {
			const summon = item as GridSummon
			const uncap = summon.summon?.uncap
			return { flb: uncap?.flb, ulb: uncap?.ulb, transcendence: uncap?.transcendence }
		}
	})
</script>

<div class="team-view">
	<DetailsSection title="Uncap & Transcendence">
		<DetailRow label="Max Uncap Level">
			<UncapIndicator
				{type}
				uncapLevel={gridUncapLevel}
				transcendenceStage={gridTranscendence}
				flb={uncapCaps?.flb}
				ulb={uncapCaps?.ulb}
				transcendence={uncapCaps?.transcendence}
			/>
		</DetailRow>
	</DetailsSection>

	{#if type === 'character'}
		{@const char = item as GridCharacter}

		{#if modificationStatus.hasAwakening}
			<DetailsSection title="Awakening">
				<AwakeningDisplay
					{...(char.awakening ? { awakening: char.awakening } : {})}
					size="medium"
					showLevel={true}
				/>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasRings || modificationStatus.hasEarring}
			<DetailsSection title="Mastery">
				<MasteryDisplay
					rings={char.overMastery}
					earring={char.aetherialMastery}
					characterElement={char.character?.element}
					variant="detailed"
					showIcons={true}
				/>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasPerpetuity}
			<DetailsSection title="Status">
				<DetailRow label="Perpetuity Ring" value="Active" />
			</DetailsSection>
		{/if}

		{#if char.artifact}
			<DetailsSection title="Artifact">
				<ArtifactSummary artifact={char.artifact} />
			</DetailsSection>
		{/if}
	{:else if type === 'weapon'}
		{@const weapon = item as GridWeapon}

		{#if modificationStatus.hasAwakening && weapon.awakening}
			<DetailsSection title="Awakening">
				<AwakeningDisplay awakening={weapon.awakening} size="medium" showLevel={true} />
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasWeaponKeys}
			<DetailsSection title={getWeaponKeyTitle(weapon.weapon?.series)}>
				<WeaponKeysList weaponKeys={weapon.weaponKeys} weaponData={weapon.weapon} layout="list" />
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasAxSkills && weapon.ax?.length}
			<DetailsSection title="AX Skills">
				{#each weapon.ax as axSkill}
					{#if axSkill.modifier?.id}
						<DetailRow
							label={axSkill.modifier.nameEn}
							value={`+${axSkill.strength}${axSkill.modifier.suffix ?? ''}`}
						/>
					{/if}
				{/each}
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasBefoulment && weapon.befoulment?.modifier}
			<DetailsSection title="Befoulment">
				<DetailRow
					label={weapon.befoulment.modifier.nameEn}
					value={`${weapon.befoulment.strength}${weapon.befoulment.modifier.suffix ?? ''}`}
				/>
				<DetailRow
					label="Exorcism Level"
					value={`${weapon.befoulment.exorcismLevel ?? 0}`}
				/>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasElement && weapon.element}
			<DetailsSection title="Element Override">
				<DetailRow label="Weapon Element">
					<ElementLabel element={weapon.element} size="medium" />
				</DetailRow>
			</DetailsSection>
		{/if}
	{:else if type === 'summon'}
		{@const summon = item as GridSummon}

		{#if modificationStatus.hasQuickSummon || modificationStatus.hasFriendSummon}
			<DetailsSection title="Summon Status">
				{#if summon.quickSummon}
					<DetailRow label="Quick Summon" value="Enabled" />
				{/if}
				{#if summon.friend}
					<DetailRow label="Friend Summon" value="Yes" />
				{/if}
			</DetailsSection>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.team-view {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}
</style>
