<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
	import FullAutoSkillsSection from './FullAutoSkillsSection.svelte'
	import DetailRow from './DetailRow.svelte'
	import AwakeningDisplay from '../modifications/AwakeningDisplay.svelte'
	import MasteryDisplay from '../modifications/MasteryDisplay.svelte'
	import WeaponKeysList from '../modifications/WeaponKeysList.svelte'
	import ArtifactSummary from '../modifications/ArtifactSummary.svelte'
	import NotesReadOnlySection from '../notes/NotesReadOnlySection.svelte'
	import EmptySectionPlaceholder from './EmptySectionPlaceholder.svelte'
	import { openCharacterEditSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { getWeaponKeyTitle } from '$lib/utils/modificationFormatters'
	import { seriesHasWeaponKeys, getSeriesSlug } from '$lib/utils/weaponSeries'
	import WeaponKeySelect from '$lib/components/sidebar/edit/WeaponKeySelect.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ElementPickerSegmented from '$lib/components/ui/element-picker/ElementPickerSegmented.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import TranscendenceStar from '$lib/components/uncap/TranscendenceStar.svelte'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import { getBulletImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { useUpdateGridWeapon } from '$lib/api/mutations/grid.mutations'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import SyncMenuButton from './SyncMenuButton.svelte'
	import { hasField, hasAnyField, type OutOfSyncFields } from '$lib/utils/outOfSync'
	import * as m from '$lib/paraglide/messages'

	type ElementColor = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
		gridUncapLevel: number | null
		gridTranscendence: number | null
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic modification status
		modificationStatus: any
		isPartyOwner?: boolean
		/** Camel-cased dotted-key list of out-of-sync fields from the backend. */
		outOfSyncFields?: OutOfSyncFields
		canPull?: boolean
		canPush?: boolean
		isSyncing?: boolean
		isSyncingToCollection?: boolean
		syncElement?: ElementColor | undefined
		/** Called with the camelCase field keys the section owns. */
		onSyncFromCollection?: (fields: string[]) => void
		/** Called with a localized scope label + field keys so the parent can
		 * open the push-confirm dialog and target the right fields. */
		onSyncToCollection?: (scope: string, fields: string[]) => void
	}

	let {
		type,
		item,
		gridUncapLevel,
		gridTranscendence,
		modificationStatus,
		isPartyOwner = false,
		outOfSyncFields,
		canPull = false,
		canPush = false,
		isSyncing = false,
		isSyncingToCollection = false,
		syncElement,
		onSyncFromCollection,
		onSyncToCollection
	}: Props = $props()

	const updateWeaponMutation = useUpdateGridWeapon()
	let showElementPicker = $state(false)
	let showWeaponKeyEditor = $state(false)
	let editKey1 = $state<string | undefined>(undefined)
	let editKey2 = $state<string | undefined>(undefined)
	let editKey3 = $state<string | undefined>(undefined)

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	const ELEMENT_SLUG_MAP: Record<number, ElementType> = {
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	// Use the weapon's effective element (grid override or base) for button color
	const weaponElement = $derived.by(() => {
		if (type !== 'weapon') return undefined
		const weapon = item as GridWeapon
		const el = weapon.element || weapon.weapon?.element
		return el ? ELEMENT_SLUG_MAP[el] : undefined
	})

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

	function openCharacterEdit(tab: 'stats' | 'notes') {
		if (type !== 'character') return
		const shortcode = partyStore.party?.shortcode
		const partyId = partyStore.party?.id
		openCharacterEditSidebar(item as GridCharacter, undefined, {
			partyId,
			partyShortcode: shortcode,
			initialTab: tab
		})
	}

	// Shared base props for every inline SyncMenuButton. The per-section call
	// site fills in the scope (label + field keys) so each button only syncs
	// its own section.
	const syncBase = $derived({
		type,
		element: syncElement,
		canPull,
		canPush,
		isSyncing,
		isSyncingToCollection
	})

	// Build the pull/push callbacks for a section scoped to the given fields.
	function sectionCallbacks(label: string, fields: string[]) {
		return {
			onSyncFromCollection: () => onSyncFromCollection?.(fields),
			onSyncToCollection: () => onSyncToCollection?.(label, fields)
		}
	}

	// Section-key constants. Used both to test "is this section drifting?" and
	// to pass through to the per-section sync calls.
	const UNCAP_KEYS = ['uncapLevel', 'transcendenceStep'] as const
	const AWAKENING_KEYS = ['awakeningId', 'awakeningLevel'] as const
	const OVER_MASTERY_KEYS = [
		'overMastery.0',
		'overMastery.1',
		'overMastery.2',
		'overMastery.3'
	] as const
	const AETHERIAL_MASTERY_KEYS = ['aetherialMastery'] as const
	const ELEMENT_KEYS = ['element'] as const
	const WEAPON_KEY_KEYS = ['weaponKey1', 'weaponKey2', 'weaponKey3', 'weaponKey4'] as const
	const AX_KEYS = ['ax.0', 'ax.1'] as const
	const BEFOULMENT_KEYS = ['befoulmentModifier', 'befoulmentStrength', 'exorcismLevel'] as const

	const uncapSectionOOS = $derived(hasAnyField(outOfSyncFields, UNCAP_KEYS))
	const awakeningSectionOOS = $derived(hasAnyField(outOfSyncFields, AWAKENING_KEYS))
	const overMasterySectionOOS = $derived(hasAnyField(outOfSyncFields, OVER_MASTERY_KEYS))
	const elementSectionOOS = $derived(hasField(outOfSyncFields, 'element'))
	const befoulmentSectionOOS = $derived(hasAnyField(outOfSyncFields, BEFOULMENT_KEYS))
	const aetherialMasterySectionOOS = $derived(hasField(outOfSyncFields, 'aetherialMastery'))
	const weaponKeysSectionOOS = $derived(hasAnyField(outOfSyncFields, WEAPON_KEY_KEYS))
	const axSectionOOS = $derived(hasAnyField(outOfSyncFields, AX_KEYS))
	const bulletKeys = $derived((outOfSyncFields ?? []).filter((key) => key.startsWith('bullets.')))
	const bulletsSectionOOS = $derived(bulletKeys.length > 0)

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
	{#if type === 'character'}
		<FullAutoSkillsSection item={item as GridCharacter} {isPartyOwner} />
	{/if}

	<NotesReadOnlySection {type} {item} {isPartyOwner} mode="filled" />

	<DetailsSection title={m.details_uncap_transcendence()}>
		{#snippet action()}
			{#if uncapSectionOOS}
				<SyncMenuButton
					{...syncBase}
					{...sectionCallbacks(m.details_uncap_transcendence(), [...UNCAP_KEYS])}
				/>
			{/if}
		{/snippet}
		<DetailRow label={m.details_max_uncap_level()}>
			<UncapIndicator
				{type}
				uncapLevel={gridUncapLevel}
				transcendenceStage={gridTranscendence}
				flb={uncapCaps?.flb}
				ulb={uncapCaps?.ulb}
				transcendence={uncapCaps?.transcendence}
				hideTranscendence
			/>
		</DetailRow>
		{#if uncapCaps?.transcendence}
			<DetailRow label={m.details_transcended_to()}>
				<span class="transcendence-row">
					<TranscendenceStar stage={gridTranscendence ?? 0} {type} />
					<span class="transcendence-level"
						>{m.details_transcendence_level({ level: String(gridTranscendence ?? 0) })}</span
					>
				</span>
			</DetailRow>
		{/if}
	</DetailsSection>

	{#if type === 'character'}
		{@const char = item as GridCharacter}

		{#if modificationStatus.hasAwakening}
			<DetailsSection title={m.details_awakening()}>
				{#snippet action()}
					{#if awakeningSectionOOS}
						<SyncMenuButton
							{...syncBase}
							{...sectionCallbacks(m.details_awakening(), [...AWAKENING_KEYS])}
						/>
					{/if}
				{/snippet}
				<AwakeningDisplay
					{...char.awakening ? { awakening: char.awakening } : {}}
					size="medium"
					showLevel={true}
				/>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasRings}
			<DetailsSection title={m.details_over_mastery()}>
				{#snippet action()}
					{#if overMasterySectionOOS}
						<SyncMenuButton
							{...syncBase}
							{...sectionCallbacks(m.details_over_mastery(), [...OVER_MASTERY_KEYS])}
						/>
					{/if}
				{/snippet}
				<MasteryDisplay
					rings={char.overMastery}
					characterElement={char.character?.element}
					variant="detailed"
					showIcons={true}
				/>
			</DetailsSection>
		{/if}

		{#if modificationStatus.hasEarring}
			<DetailsSection title={m.details_aetherial_mastery()}>
				{#snippet action()}
					{#if aetherialMasterySectionOOS}
						<SyncMenuButton
							{...syncBase}
							{...sectionCallbacks(m.details_aetherial_mastery(), [...AETHERIAL_MASTERY_KEYS])}
						/>
					{/if}
				{/snippet}
				<MasteryDisplay
					earring={char.aetherialMastery}
					characterElement={char.character?.element}
					variant="detailed"
					showIcons={true}
				/>
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
				{#snippet action()}
					{#if awakeningSectionOOS}
						<SyncMenuButton
							{...syncBase}
							{...sectionCallbacks(m.details_awakening(), [...AWAKENING_KEYS])}
						/>
					{/if}
				{/snippet}
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
					<div class="section-actions">
						{#if elementSectionOOS}
							<SyncMenuButton
								{...syncBase}
								{...sectionCallbacks(m.details_element(), [...ELEMENT_KEYS])}
							/>
						{/if}
						{#if isPartyOwner}
							<Button
								variant="element-ghost"
								size="small"
								element={weaponElement}
								onclick={() => (showElementPicker = !showElementPicker)}
							>
								{showElementPicker ? m.action_done() : m.action_change()}
							</Button>
						{/if}
					</div>
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
					<div class="section-actions">
						{#if weaponKeysSectionOOS}
							<SyncMenuButton
								{...syncBase}
								{...sectionCallbacks(getWeaponKeyTitle(weapon.weapon?.series), [
									...WEAPON_KEY_KEYS
								])}
							/>
						{/if}
						{#if isPartyOwner}
							<Button
								variant="element-ghost"
								size="small"
								element={weaponElement}
								onclick={() => {
									if (showWeaponKeyEditor) {
										handleWeaponKeySave()
									} else {
										const weapon = item as GridWeapon
										editKey1 = weapon.weaponKeys?.find((k) => k.slot === 0)?.id
										editKey2 = weapon.weaponKeys?.find((k) => k.slot === 1)?.id
										editKey3 = weapon.weaponKeys?.find((k) => k.slot === 2)?.id
										showWeaponKeyEditor = true
									}
								}}
							>
								{showWeaponKeyEditor ? m.action_save() : m.action_change()}
							</Button>
						{/if}
					</div>
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
				{#snippet action()}
					{#if axSectionOOS}
						<SyncMenuButton
							{...syncBase}
							{...sectionCallbacks(m.details_ax_skills(), [...AX_KEYS])}
						/>
					{/if}
				{/snippet}
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
				{#snippet action()}
					{#if befoulmentSectionOOS}
						<SyncMenuButton
							{...syncBase}
							{...sectionCallbacks(m.details_befoulment(), [...BEFOULMENT_KEYS])}
						/>
					{/if}
				{/snippet}
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
				{#snippet action()}
					{#if bulletsSectionOOS}
						<SyncMenuButton {...syncBase} {...sectionCallbacks(m.details_bullets(), bulletKeys)} />
					{/if}
				{/snippet}
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
				<!-- summon's two grid-only toggles (quickSummon, friend) are not tracked
				     by the collection model, so no sync button is rendered here. -->
				{#if summon.quickSummon}
					<DetailRow label={m.details_quick_summon()} value={m.details_enabled()} />
				{/if}
				{#if summon.friend}
					<DetailRow label={m.details_friend_summon()} value={m.details_yes()} />
				{/if}
			</DetailsSection>
		{/if}
	{/if}

	{#if isPartyOwner && type === 'character'}
		{@const char = item as GridCharacter}
		<!-- Owner-only Add placeholders go at the very bottom so every filled
		     section (notes + mastery + everything else) sorts above every
		     skeleton placeholder, regardless of which section group it's in. -->
		{#if !modificationStatus.hasRings}
			<DetailsSection title={m.details_over_mastery()}>
				<EmptySectionPlaceholder
					sectionName={m.add_over_mastery()}
					description={m.empty_over_mastery_description()}
					onclick={() => openCharacterEdit('stats')}
				/>
			</DetailsSection>
		{/if}
		{#if !modificationStatus.hasEarring}
			<DetailsSection title={m.details_aetherial_mastery()}>
				<EmptySectionPlaceholder
					sectionName={m.add_aetherial_mastery()}
					description={m.empty_aetherial_mastery_description()}
					onclick={() => openCharacterEdit('stats')}
				/>
			</DetailsSection>
		{/if}
		<NotesReadOnlySection type="character" item={char} {isPartyOwner} mode="placeholders" />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

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

	.section-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.transcendence-row {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.transcendence-level {
		font-size: typography.$font-regular;
		color: var(--text-primary);
		font-weight: typography.$medium;
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
