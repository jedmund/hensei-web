<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import AwakeningDisplay from '../modifications/AwakeningDisplay.svelte'
	import MasteryDisplay from '../modifications/MasteryDisplay.svelte'
	import WeaponKeysList from '../modifications/WeaponKeysList.svelte'
	import ArtifactSummary from '../modifications/ArtifactSummary.svelte'
	import { getWeaponKeyTitle } from '$lib/utils/modificationFormatters'
	import { seriesHasWeaponKeys, getSeriesSlug } from '$lib/utils/weaponSeries'
	import WeaponKeySelect from '$lib/components/sidebar/edit/WeaponKeySelect.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ElementPickerSegmented from '$lib/components/ui/element-picker/ElementPickerSegmented.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import { getBulletImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { useUpdateGridWeapon } from '$lib/api/mutations/grid.mutations'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		gridUncapLevel: number | null
		gridTranscendence: number | null
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic modification status
		modificationStatus: any
		isPartyOwner?: boolean
	}

	let {
		type,
		item,
		gridUncapLevel,
		gridTranscendence,
		modificationStatus,
		isPartyOwner = false
	}: Props = $props()

	const updateWeaponMutation = useUpdateGridWeapon()
	let showElementPicker = $state(false)
	let showWeaponKeyEditor = $state(false)
	let editKey1 = $state<string | undefined>(undefined)
	let editKey2 = $state<string | undefined>(undefined)
	let editKey3 = $state<string | undefined>(undefined)

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	const userElement = $derived(partyStore.party?.user?.avatar?.element as ElementType | undefined)

	function handleElementChange(value: number | number[]) {
		const element = typeof value === 'number' ? value : value[0]
		if (element === undefined) return

		const weapon = item as GridWeapon
		const shortcode = partyStore.party?.shortcode
		if (!weapon.id || !shortcode) return

		updateWeaponMutation.mutate({
			id: weapon.id,
			partyShortcode: shortcode,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial update only needs element field
			updates: { element } as any
		})
		showElementPicker = false
	}

	// Weapon key editing
	const seriesSlug = $derived(getSeriesSlug((item as GridWeapon).weapon?.series))
	const keySlotCount = $derived((item as GridWeapon).weapon?.series?.numWeaponKeys ?? 0)

	function handleWeaponKeySave() {
		const weapon = item as GridWeapon
		const shortcode = partyStore.party?.shortcode
		if (!weapon.id || !shortcode) return

		const updates: Record<string, unknown> = {}
		if (editKey1 !== undefined) updates.weaponKey1Id = editKey1
		if (editKey2 !== undefined) updates.weaponKey2Id = editKey2
		if (editKey3 !== undefined) updates.weaponKey3Id = editKey3

		updateWeaponMutation.mutate({
			id: weapon.id,
			partyShortcode: shortcode,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial update only needs key fields
			updates: updates as any
		})
		showWeaponKeyEditor = false
	}

	// Get uncap capabilities from item data based on type
	let uncapCaps = $derived.by(() => {
		if (type === 'character') {
			const char = item as GridCharacter
			const uncap = char.character?.uncap
			return {
				flb: uncap?.flb,
				ulb: uncap?.transcendence,
				transcendence: uncap?.transcendence ?? false
			}
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
					{...char.awakening ? { awakening: char.awakening } : {}}
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

		{#if weapon.weapon?.element === 0}
			<DetailsSection
				title={m.details_element()}
				empty={!weapon.element && !showElementPicker}
				emptyMessage={m.details_element_not_set()}
			>
				{#snippet action()}
					{#if isPartyOwner}
						<Button
							variant="element-ghost"
							size="small"
							element={userElement}
							onclick={() => (showElementPicker = !showElementPicker)}
						>
							{showElementPicker ? m.action_done() : m.action_change()}
						</Button>
					{/if}
				{/snippet}
				{#if showElementPicker}
					<ElementPickerSegmented
						value={weapon.element || undefined}
						onValueChange={handleElementChange}
						contained
						class="element-picker-full"
					/>
				{:else}
					<DetailRow label={m.details_weapon_element()}>
						<ElementLabel element={weapon.element} size="medium" />
					</DetailRow>
				{/if}
			</DetailsSection>
		{/if}

		{#if seriesHasWeaponKeys(weapon.weapon?.series)}
			<DetailsSection
				title={getWeaponKeyTitle(weapon.weapon?.series)}
				empty={!modificationStatus.hasWeaponKeys && !showWeaponKeyEditor}
				emptyMessage={m.details_weapon_keys_not_set()}
			>
				{#snippet action()}
					{#if isPartyOwner}
						<Button
							variant="element-ghost"
							size="small"
							element={userElement}
							onclick={() => {
								if (showWeaponKeyEditor) {
									handleWeaponKeySave()
								} else {
									const weapon = item as GridWeapon
									editKey1 = weapon.weaponKeys?.[0]?.id
									editKey2 = weapon.weaponKeys?.[1]?.id
									editKey3 = weapon.weaponKeys?.[2]?.id
									showWeaponKeyEditor = true
								}
							}}
						>
							{showWeaponKeyEditor ? m.action_save() : m.action_change()}
						</Button>
					{/if}
				{/snippet}
				{#if showWeaponKeyEditor}
					<div class="key-selects">
						{#if keySlotCount >= 1}
							<WeaponKeySelect
								{seriesSlug}
								slot={0}
								bind:value={editKey1}
								transcendenceStep={weapon.transcendenceStep ?? 0}
							/>
						{/if}
						{#if keySlotCount >= 2}
							<WeaponKeySelect
								{seriesSlug}
								slot={1}
								bind:value={editKey2}
								transcendenceStep={weapon.transcendenceStep ?? 0}
							/>
						{/if}
						{#if keySlotCount >= 3}
							<WeaponKeySelect
								{seriesSlug}
								slot={2}
								bind:value={editKey3}
								transcendenceStep={weapon.transcendenceStep ?? 0}
							/>
						{/if}
					</div>
				{:else}
					<WeaponKeysList weaponKeys={weapon.weaponKeys} weaponData={weapon.weapon} layout="list" />
				{/if}
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasAxSkills && weapon.ax?.length}
			<DetailsSection title={m.details_ax_skills()}>
				{#each weapon.ax as axSkill, i (i)}
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

		{#if modificationStatus.hasBullets && weapon.bullets?.length}
			<DetailsSection title={m.details_bullets()}>
				{#each weapon.bullets as loadout (loadout.position)}
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

	:global(.element-picker-full) {
		width: 100%;
		display: flex;

		:global(.element-group) {
			width: 100%;
			justify-content: space-between;
		}
	}

	.key-selects {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
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
