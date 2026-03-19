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
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import { getBulletImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

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
			return { flb: uncap?.flb, ulb: uncap?.transcendence, transcendence: uncap?.transcendence ?? false }
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
	<DetailsSection title={m.details_uncap_transcendence()}>
		<DetailRow label={m.details_max_uncap_level()}>
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
			<DetailsSection title={m.details_awakening()}>
				<AwakeningDisplay
					{...(char.awakening ? { awakening: char.awakening } : {})}
					size="medium"
					showLevel={true}
				/>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasRings || modificationStatus.hasEarring}
			<DetailsSection title={m.details_mastery()}>
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
			<DetailsSection title={m.details_status()}>
				<DetailRow label={m.details_perpetuity_ring()} value={m.details_active()} />
			</DetailsSection>
		{/if}

		{#if char.artifact}
			<DetailsSection title={m.details_artifact()}>
				<ArtifactSummary artifact={char.artifact} />
			</DetailsSection>
		{/if}
	{:else if type === 'weapon'}
		{@const weapon = item as GridWeapon}

		{#if modificationStatus.hasAwakening && weapon.awakening}
			<DetailsSection title={m.details_awakening()}>
				<AwakeningDisplay awakening={weapon.awakening} size="medium" showLevel={true} />
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasWeaponKeys}
			<DetailsSection title={getWeaponKeyTitle(weapon.weapon?.series)}>
				<WeaponKeysList weaponKeys={weapon.weaponKeys} weaponData={weapon.weapon} layout="list" />
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasAxSkills && weapon.ax?.length}
			<DetailsSection title={m.details_ax_skills()}>
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
			<DetailsSection title={m.details_befoulment()}>
				<DetailRow
					label={weapon.befoulment.modifier.nameEn}
					value={`${weapon.befoulment.strength}${weapon.befoulment.modifier.suffix ?? ''}`}
				/>
				<DetailRow
					label={m.details_exorcism_level()}
					value={`${weapon.befoulment.exorcismLevel ?? 0}`}
				/>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasElement && weapon.element}
			<DetailsSection title={m.details_element_override()}>
				<DetailRow label={m.details_weapon_element()}>
					<ElementLabel element={weapon.element} size="medium" />
				</DetailRow>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasBullets && weapon.bullets?.length}
			<DetailsSection title={m.details_bullets()}>
				{#each weapon.bullets as loadout}
					<DetailRow label={BULLET_TYPES[loadout.bullet.bulletType] ?? 'Unknown'}>
						<span class="bullet-value">
							<img src={getBulletImage(loadout.bullet.granblueId)} alt="" class="bullet-icon" />
							{localizedName(loadout.bullet.name)}
						</span>
					</DetailRow>
				{/each}
			</DetailsSection>
		{/if}
	{:else if type === 'summon'}
		{@const summon = item as GridSummon}

		{#if modificationStatus.hasQuickSummon || modificationStatus.hasFriendSummon}
			<DetailsSection title={m.details_summon_status()}>
				{#if summon.quickSummon}
					<DetailRow label={m.details_quick_summon()} value={m.details_enabled()} />
				{/if}
				{#if summon.friend}
					<DetailRow label={m.details_friend_summon()} value={m.details_yes()} />
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

	.bullet-value {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.bullet-icon {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}
</style>
