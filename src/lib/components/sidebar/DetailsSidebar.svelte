<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import { getElementLabel } from '$lib/utils/element'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getProficiencyLabel } from '$lib/utils/proficiency'
	import { getRaceLabel } from '$lib/utils/race'
	import { getGenderLabel } from '$lib/utils/gender'
	import {
		getCharacterDetailImage,
		getWeaponBaseImage,
		getSummonDetailImage,
		getCharacterPose
	} from '$lib/utils/images'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { detectModifications } from '$lib/utils/modificationDetector'
	import {
		formatRingStat,
		formatEarringStat,
		formatAxSkill,
		getWeaponKeyTitle,
		getElementName
	} from '$lib/utils/modificationFormatters'
	import DetailsSidebarSegmentedControl from './modifications/DetailsSidebarSegmentedControl.svelte'
	import ModificationSection from './modifications/ModificationSection.svelte'
	import AwakeningDisplay from './modifications/AwakeningDisplay.svelte'
	import WeaponKeysList from './modifications/WeaponKeysList.svelte'
	import StatModifierItem from './modifications/StatModifierItem.svelte'
	import UncapStatusDisplay from './modifications/UncapStatusDisplay.svelte'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
	}

	let { type, item }: Props = $props()

	let selectedView = $state<'canonical' | 'user'>('canonical')
	let modificationStatus = $derived(detectModifications(type, item))

	// Helper to get the actual item data
	function getItemData() {
		if (type === 'character') {
			return (item as GridCharacter).character
		} else if (type === 'weapon') {
			return (item as GridWeapon).weapon
		} else {
			return (item as GridSummon).summon
		}
	}

	// Helper for localized names
	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') {
			return maybe.en || maybe.ja || '—'
		}
		return '—'
	}

	// Get the item's actual data
	const itemData = $derived(getItemData())

	// Grid item info (uncap levels from the grid item itself)
	const gridUncapLevel = $derived(
		type === 'character'
			? (item as GridCharacter).uncapLevel
			: type === 'weapon'
				? (item as GridWeapon).uncapLevel
				: (item as GridSummon).uncapLevel
	)

	const gridTranscendence = $derived(
		type === 'character'
			? (item as GridCharacter).transcendenceStep
			: type === 'weapon'
				? (item as GridWeapon).transcendenceStep
				: (item as GridSummon).transcendenceStep
	)

	// Get image URL based on type using detail/base variants
	function getImageUrl(): string {
		const id = itemData?.granblueId

		if (type === 'character') {
			const pose = getCharacterPose(gridUncapLevel, gridTranscendence)
			return getCharacterDetailImage(id, pose)
		} else if (type === 'weapon') {
			return getWeaponBaseImage(id)
		} else {
			return getSummonDetailImage(id)
		}
	}

	// Get element-based background color
	function getElementBackground(): string {
		const element = itemData?.element
		switch (element) {
			case 1: return 'var(--wind-item-detail-bg)'
			case 2: return 'var(--fire-item-detail-bg)'
			case 3: return 'var(--water-item-detail-bg)'
			case 4: return 'var(--earth-item-detail-bg)'
			case 5: return 'var(--dark-item-detail-bg)'
			case 6: return 'var(--light-item-detail-bg)'
			default: return 'var(--null-item-detail-bg)'
		}
	}
</script>

<div class="details-sidebar">
	<div class="item-header" style="background: {getElementBackground()}">
		<img src={getImageUrl()} alt={displayName(itemData)} class="item-image {type}" />
	</div>

	<DetailsSidebarSegmentedControl
		hasModifications={modificationStatus.hasModifications}
		bind:selectedView
	/>

	{#if selectedView === 'canonical'}
	<div class="canonical-view">
	<div class="details-section">
		<h3>Basic Information</h3>
		<div class="detail-row">
			<span class="label">Rarity</span>
			<span class="value">{getRarityLabel(itemData?.rarity)}</span>
		</div>
		<div class="detail-row">
			<span class="label">Element</span>
			<span class="value">{getElementLabel(itemData?.element)}</span>
		</div>

		{#if type === 'character'}
			{#if itemData?.race && itemData.race.length > 0}
				<div class="detail-row">
					<span class="label">Race</span>
					<span class="value">
						{itemData.race
							.map((r) => getRaceLabel(r))
							.filter(Boolean)
							.join(', ') || '—'}
					</span>
				</div>
			{/if}
			<div class="detail-row">
				<span class="label">Gender</span>
				<span class="value">{getGenderLabel(itemData?.gender)}</span>
			</div>
			{#if itemData?.proficiency && itemData.proficiency.length > 0}
				<div class="detail-row">
					<span class="label">Proficiencies</span>
					<span class="value">
						{itemData.proficiency
							.map((p) => getProficiencyLabel(p))
							.filter(Boolean)
							.join(', ') || '—'}
					</span>
				</div>
			{/if}
		{:else if type === 'weapon'}
			<div class="detail-row">
				<span class="label">Proficiency</span>
				<span class="value">{getProficiencyLabel(itemData?.proficiency?.[0])}</span>
			</div>
		{/if}
	</div>

	<div class="details-section">
		<h3>Uncap Status</h3>
		<div class="uncap-display">
			<UncapIndicator
				{type}
				uncapLevel={gridUncapLevel}
				transcendenceStage={gridTranscendence}
				special={itemData?.special}
				flb={itemData?.uncap?.flb}
				ulb={itemData?.uncap?.ulb}
				transcendence={itemData?.uncap?.transcendence}
				editable={false}
			/>
		</div>
		<div class="detail-row">
			<span class="label">Current Uncap</span>
			<span class="value">{gridUncapLevel ?? 0}★</span>
		</div>
		{#if gridTranscendence && gridTranscendence > 0}
			<div class="detail-row">
				<span class="label">Transcendence</span>
				<span class="value">Stage {gridTranscendence}</span>
			</div>
		{/if}
		{#if itemData?.uncap}
			<div class="detail-row">
				<span class="label">Available Uncaps</span>
				<span class="value">
					{[
						itemData.uncap.flb && 'FLB',
						itemData.uncap.ulb && 'ULB',
						itemData.uncap.transcendence && 'Transcendence'
					]
						.filter(Boolean)
						.join(', ') || 'Standard'}
				</span>
			</div>
		{/if}
	</div>

	<div class="details-section">
		<h3>Stats</h3>
		{#if itemData?.hp}
			<div class="stats-group">
				<h4>HP</h4>
				<div class="detail-row">
					<span class="label">Base</span>
					<span class="value">{itemData.hp.minHp ?? '—'}</span>
				</div>
				<div class="detail-row">
					<span class="label">Max</span>
					<span class="value">{itemData.hp.maxHp ?? '—'}</span>
				</div>
				{#if itemData.uncap?.flb && itemData.hp.maxHpFlb}
					<div class="detail-row">
						<span class="label">Max (FLB)</span>
						<span class="value">{itemData.hp.maxHpFlb}</span>
					</div>
				{/if}
				{#if itemData.uncap?.ulb && itemData.hp.maxHpUlb}
					<div class="detail-row">
						<span class="label">Max (ULB)</span>
						<span class="value">{itemData.hp.maxHpUlb}</span>
					</div>
				{/if}
			</div>
		{/if}

		{#if itemData?.atk}
			<div class="stats-group">
				<h4>Attack</h4>
				<div class="detail-row">
					<span class="label">Base</span>
					<span class="value">{itemData.atk.minAtk ?? '—'}</span>
				</div>
				<div class="detail-row">
					<span class="label">Max</span>
					<span class="value">{itemData.atk.maxAtk ?? '—'}</span>
				</div>
				{#if itemData.uncap?.flb && itemData.atk.maxAtkFlb}
					<div class="detail-row">
						<span class="label">Max (FLB)</span>
						<span class="value">{itemData.atk.maxAtkFlb}</span>
					</div>
				{/if}
				{#if itemData.uncap?.ulb && itemData.atk.maxAtkUlb}
					<div class="detail-row">
						<span class="label">Max (ULB)</span>
						<span class="value">{itemData.atk.maxAtkUlb}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	{#if type === 'weapon' && itemData?.weaponSkills && itemData.weaponSkills.length > 0}
		<div class="details-section">
			<h3>Skills</h3>
			<div class="skills-list">
				{#each itemData.weaponSkills as skill}
					<div class="skill-item">
						<h4>{displayName(skill) || 'Unknown Skill'}</h4>
						{#if skill.description}
							<p>{skill.description}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if type === 'summon' && itemData?.summonAuras && itemData.summonAuras.length > 0}
		<div class="details-section">
			<h3>Auras</h3>
			<div class="auras-list">
				{#each itemData.summonAuras as aura}
					<div class="aura-item">
						<h4>{displayName(aura) || 'Unknown Aura'}</h4>
						{#if aura.description}
							<p>{aura.description}</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if type === 'weapon' && itemData?.weaponKeys && itemData.weaponKeys.length > 0}
		<div class="details-section">
			<h3>Weapon Keys</h3>
			<div class="keys-list">
				{#each itemData.weaponKeys as key}
					<div class="key-item">
						<span class="key-slot">Slot {key.slot}</span>
						<span class="key-name">{displayName(key.weaponKey1) || '—'}</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	{#if type === 'character' && itemData?.special}
		<div class="details-section">
			<div class="detail-row special-indicator">
				<span class="label">Special Character</span>
				<span class="value">✓</span>
			</div>
		</div>
	{/if}
	</div>
	{:else}
	<div class="user-version-view">
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
						awakening={char.awakening}
						size="medium"
						showLevel={false}
					/>
				</ModificationSection>
			{/if}

			{#if modificationStatus.hasRings}
				<ModificationSection title="Over Mastery Rings" visible={true}>
					{#each (char.rings || char.over_mastery || []) as ring}
						<StatModifierItem
							label={formatRingStat(ring.modifier, ring.strength).split('+')[0].trim()}
							value={`+${ring.strength}`}
							suffix={ring.modifier <= 2 ? '' : '%'}
						/>
					{/each}
				</ModificationSection>
			{/if}

			{#if modificationStatus.hasEarring}
				{@const earring = char.earring || char.aetherial_mastery}
				{#if earring}
					<ModificationSection title="Aetherial Mastery" visible={true}>
						<StatModifierItem
							label={formatEarringStat(earring.modifier, earring.strength).split('+')[0].trim()}
							value={`+${earring.strength}`}
							suffix={earring.modifier <= 3 ? '' : '%'}
							variant="enhanced"
						/>
					</ModificationSection>
				{/if}
			{/if}

			{#if modificationStatus.hasPerpetuity}
				<ModificationSection title="Status" visible={true}>
					<StatModifierItem
						label="Perpetuity"
						value="Active"
						variant="max"
					/>
				</ModificationSection>
			{/if}

		{:else if type === 'weapon'}
			{@const weapon = item as GridWeapon}

			{#if modificationStatus.hasAwakening && weapon.awakening}
				<ModificationSection title="Awakening" visible={true}>
					<AwakeningDisplay
						awakening={weapon.awakening}
						size="medium"
						showLevel={true}
					/>
				</ModificationSection>
			{/if}

			{#if modificationStatus.hasWeaponKeys}
				<ModificationSection title={getWeaponKeyTitle(weapon.weapon?.series)} visible={true}>
					<WeaponKeysList
						weaponKeys={weapon.weaponKeys}
						weaponData={weapon.weapon}
						layout="list"
					/>
				</ModificationSection>
			{/if}

			{#if modificationStatus.hasAxSkills && weapon.ax}
				<ModificationSection title="AX Skills" visible={true}>
					{#each weapon.ax as axSkill}
						<StatModifierItem
							label={formatAxSkill(axSkill).split('+')[0].trim()}
							value={`+${axSkill.strength}`}
							suffix={axSkill.modifier <= 2 ? '' : '%'}
							variant="enhanced"
						/>
					{/each}
				</ModificationSection>
			{/if}

			{#if modificationStatus.hasElement && weapon.element}
				<ModificationSection title="Element Override" visible={true}>
					<StatModifierItem
						label="Instance Element"
						value={getElementName(weapon.element)}
					/>
				</ModificationSection>
			{/if}

		{:else if type === 'summon'}
			{@const summon = item as GridSummon}

			{#if modificationStatus.hasQuickSummon || modificationStatus.hasFriendSummon}
				<ModificationSection title="Summon Status" visible={true}>
					{#if summon.quickSummon}
						<StatModifierItem
							label="Quick Summon"
							value="Enabled"
							variant="enhanced"
						/>
					{/if}
					{#if summon.friend}
						<StatModifierItem
							label="Friend Summon"
							value="Yes"
						/>
					{/if}
				</ModificationSection>
			{/if}
		{/if}

		<ModificationSection title="Basic Information" visible={true}>
			<div class="detail-row">
				<span class="label">Rarity</span>
				<span class="value">{getRarityLabel(itemData?.rarity)}</span>
			</div>
			<div class="detail-row">
				<span class="label">Element</span>
				<span class="value">{getElementLabel(itemData?.element)}</span>
			</div>

			{#if type === 'character'}
				{#if itemData?.race && itemData.race.length > 0}
					<div class="detail-row">
						<span class="label">Race</span>
						<span class="value">
							{itemData.race
								.map((r) => getRaceLabel(r))
								.filter(Boolean)
								.join(', ') || '—'}
						</span>
					</div>
				{/if}
				<div class="detail-row">
					<span class="label">Gender</span>
					<span class="value">{getGenderLabel(itemData?.gender)}</span>
				</div>
			{:else if type === 'weapon'}
				<div class="detail-row">
					<span class="label">Proficiency</span>
					<span class="value">{getProficiencyLabel(itemData?.proficiency?.[0])}</span>
				</div>
			{/if}
		</ModificationSection>
	</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.details-sidebar {
		padding: 0 0 spacing.$unit-2x;
		color: var(--text-primary, colors.$grey-10);
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.item-header {
		display: flex;
		gap: spacing.$unit-2x;
		align-items: flex-start;
		border-radius: layout.$item-corner;
		border: 1px solid colors.$grey-70;
		justify-content: center;
		transition: background 0.3s ease;

		.item-image.weapon {
			width: 62%;
		}

		.item-image.summon,
		.item-image.character {
			width: 100%;
		}
	}

	.details-section {
		margin-bottom: spacing.$unit-3x;

		h3 {
			margin: 0 0 calc(spacing.$unit * 1.5) 0;
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
			color: var(--text-secondary, colors.$grey-40);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		h4 {
			margin: spacing.$unit 0 calc(spacing.$unit * 0.5) 0;
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
			color: var(--text-primary, colors.$grey-20);
		}
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

	.uncap-display {
		margin-bottom: calc(spacing.$unit * 1.5);
		padding: spacing.$unit;
		background: colors.$grey-90;
		border-radius: calc(layout.$item-corner * 0.5);
		display: flex;
		justify-content: center;
	}

	.stats-group {
		margin-bottom: spacing.$unit-2x;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.skills-list,
	.auras-list {
		.skill-item,
		.aura-item {
			padding: spacing.$unit;
			background: colors.$grey-90;
			border-radius: calc(layout.$item-corner * 0.5);
			margin-bottom: spacing.$unit;

			h4 {
				margin: 0 0 calc(spacing.$unit * 0.5) 0;
				font-size: typography.$font-regular;
				color: var(--text-primary, colors.$grey-10);
			}

			p {
				margin: 0;
				font-size: typography.$font-small;
				color: var(--text-secondary, colors.$grey-50);
				line-height: 1.4;
			}
		}
	}

	.keys-list {
		.key-item {
			display: flex;
			justify-content: space-between;
			padding: calc(spacing.$unit * 0.75);
			background: colors.$grey-90;
			border-radius: calc(layout.$item-corner * 0.5);
			margin-bottom: calc(spacing.$unit * 0.5);

			.key-slot {
				font-size: typography.$font-small;
				color: var(--text-secondary, colors.$grey-50);
			}

			.key-name {
				font-size: typography.$font-small;
				color: var(--text-primary, colors.$grey-10);
				font-weight: typography.$medium;
			}
		}
	}

	.special-indicator {
		.value {
			color: var(--color-success, #4caf50);
			font-size: typography.$font-large;
		}
	}

	.canonical-view,
	.user-version-view {
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.user-version-view {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}
</style>
