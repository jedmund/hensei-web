<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
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
	import { hasField, hasRow, hasAnyField, type OutOfSyncFields } from '$lib/utils/outOfSync'
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
		onSyncFromCollection?: () => void
		/** Called with a localized scope label so the parent can open the push-confirm dialog. */
		onSyncToCollection?: (scope: string) => void
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

	// Shared props for every inline SyncMenuButton; each call site only adds scope info.
	const syncCommon = $derived({
		type,
		element: syncElement,
		canPull,
		canPush,
		isSyncing,
		isSyncingToCollection,
		onSyncFromCollection
	})

	function pushScope(label: string) {
		return () => onSyncToCollection?.(label)
	}

	const isOverMasteryRowOOS = (index: number) => hasRow(outOfSyncFields, 'overMastery', index)
	const isWeaponKeyOOS = (slot: number) => hasField(outOfSyncFields, `weaponKey${slot + 1}`)
	const isAxRowOOS = (index: number) => hasRow(outOfSyncFields, 'ax', index)
	const isBulletRowOOS = (position: number) => hasRow(outOfSyncFields, 'bullets', position)

	// Section-level keys
	const uncapSectionOOS = $derived(
		hasAnyField(outOfSyncFields, ['uncapLevel', 'transcendenceStep'])
	)
	const awakeningSectionOOS = $derived(
		hasAnyField(outOfSyncFields, ['awakeningId', 'awakeningLevel'])
	)
	const elementSectionOOS = $derived(hasField(outOfSyncFields, 'element'))
	const befoulmentSectionOOS = $derived(
		hasAnyField(outOfSyncFields, ['befoulmentModifier', 'befoulmentStrength', 'exorcismLevel'])
	)
	const aetherialMasterySectionOOS = $derived(hasField(outOfSyncFields, 'aetherialMastery'))

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
	<NotesReadOnlySection {type} {item} {isPartyOwner} mode="filled" />

	<DetailsSection title={m.details_uncap_transcendence()}>
		{#snippet action()}
			{#if uncapSectionOOS}
				<SyncMenuButton
					{...syncCommon}
					onSyncToCollection={pushScope(m.details_uncap_transcendence())}
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
						<SyncMenuButton {...syncCommon} onSyncToCollection={pushScope(m.details_awakening())} />
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
					{#if hasAnyField( outOfSyncFields, ['overMastery.0', 'overMastery.1', 'overMastery.2', 'overMastery.3'] ) || isOverMasteryRowOOS(0)}
						<SyncMenuButton
							{...syncCommon}
							onSyncToCollection={pushScope(m.details_over_mastery())}
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
							{...syncCommon}
							onSyncToCollection={pushScope(m.details_aetherial_mastery())}
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
						<SyncMenuButton {...syncCommon} onSyncToCollection={pushScope(m.details_awakening())} />
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
							<SyncMenuButton {...syncCommon} onSyncToCollection={pushScope(m.details_element())} />
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
			{@const weaponKeysOOS =
				isWeaponKeyOOS(0) || isWeaponKeyOOS(1) || isWeaponKeyOOS(2) || isWeaponKeyOOS(3)}
			<DetailsSection
				title={getWeaponKeyTitle(weapon.weapon?.series)}
				empty={!modificationStatus.hasWeaponKeys && !showWeaponKeyEditor}
				emptyMessage={m.details_weapon_keys_not_set()}
			>
				{#snippet action()}
					<div class="section-actions">
						{#if weaponKeysOOS}
							<SyncMenuButton
								{...syncCommon}
								onSyncToCollection={pushScope(getWeaponKeyTitle(weapon.weapon?.series))}
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
			{@const axOOS = isAxRowOOS(0) || isAxRowOOS(1)}
			<DetailsSection title={m.details_ax_skills()}>
				{#snippet action()}
					{#if axOOS}
						<SyncMenuButton {...syncCommon} onSyncToCollection={pushScope(m.details_ax_skills())} />
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
							{...syncCommon}
							onSyncToCollection={pushScope(m.details_befoulment())}
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
			{@const bulletsOOS = weapon.bullets.some((b) => isBulletRowOOS(b.position))}
			<DetailsSection title={m.details_bullets()}>
				{#snippet action()}
					{#if bulletsOOS}
						<SyncMenuButton {...syncCommon} onSyncToCollection={pushScope(m.details_bullets())} />
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
					onclick={() => openCharacterEdit('stats')}
				/>
			</DetailsSection>
		{/if}
		{#if !modificationStatus.hasEarring}
			<DetailsSection title={m.details_aetherial_mastery()}>
				<EmptySectionPlaceholder
					sectionName={m.add_aetherial_mastery()}
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
