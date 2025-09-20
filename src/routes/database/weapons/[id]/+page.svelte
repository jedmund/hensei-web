<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getElementLabel, getElementIcon } from '$lib/utils/element'
	import { getProficiencyLabel, getProficiencyIcon } from '$lib/utils/proficiency'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DetailsHeader from '$lib/components/ui/DetailsHeader.svelte'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Get weapon from server data
	const weapon = $derived(data.weapon)

	// Helper function to get weapon image
	function getWeaponImage(weapon: any): string {
		if (!weapon?.granblueId) return '/images/placeholders/placeholder-weapon-main.png'

		// Handle element-specific weapons (primal weapons)
		if (weapon.element === 0 && weapon.instanceElement) {
			return `/images/weapon-grid/${weapon.granblueId}_${weapon.instanceElement}.jpg`
		}
		return `/images/weapon-grid/${weapon.granblueId}.jpg`
	}

	// Calculate uncap properties for the indicator
	const uncap = $derived(weapon?.uncap ?? {})
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)

	// Calculate maximum uncap level based on available uncaps
	// Weapons: 3 base + FLB + ULB + transcendence
	const getMaxUncapLevel = () => {
		return transcendence ? 6 : ulb ? 5 : flb ? 4 : 3
	}

	const uncapLevel = $derived(getMaxUncapLevel())
	// For details view, show maximum transcendence stage when available
	const transcendenceStage = $derived(transcendence ? 5 : 0)
</script>

<div class="weapon-detail">
	{#if weapon}
		<div class="weapon-content">
			<DetailsHeader type="weapon" item={weapon} image={getWeaponImage(weapon)} />

			<DetailsContainer title="Level & Skill">
				<DetailItem label="Max Level" value={weapon.maxLevel} />
				<DetailItem label="Max Skill Level" value={weapon.skillLevelCap} />
				{#if weapon.uncap}
					<DetailItem label="Uncap">
						<UncapIndicator
							type="weapon"
							{uncapLevel}
							{transcendenceStage}
							{flb}
							{ulb}
							{transcendence}
							editable={false}
						/>
					</DetailItem>
				{/if}
			</DetailsContainer>

			<DetailsContainer title="HP Stats">
				<DetailItem label="Base HP" value={weapon.hp?.minHp} />
				<DetailItem label="Max HP" value={weapon.hp?.maxHp} />
				{#if flb}
					<DetailItem label="Max HP (FLB)" value={weapon.hp?.maxHpFlb} />
				{/if}
				{#if ulb}
					<DetailItem label="Max HP (ULB)" value={weapon.hp?.maxHpUlb} />
				{/if}
			</DetailsContainer>

			<DetailsContainer title="Attack Stats">
				<DetailItem label="Base Attack" value={weapon.atk?.minAtk} />
				<DetailItem label="Max Attack" value={weapon.atk?.maxAtk} />
				{#if flb}
					<DetailItem label="Max Attack (FLB)" value={weapon.atk?.maxAtkFlb} />
				{/if}
				{#if ulb}
					<DetailItem label="Max Attack (ULB)" value={weapon.atk?.maxAtkUlb} />
				{/if}
			</DetailsContainer>

			<div class="weapon-skills">
				<h3>Skills</h3>
				<div class="skills-grid">
					{#if weapon.weapon_skills && weapon.weapon_skills.length > 0}
						{#each weapon.weapon_skills as skill}
							<div class="skill-item">
								<h4 class="skill-name">{skill.name || 'Unknown Skill'}</h4>
								<p class="skill-description">{skill.description || 'No description available'}</p>
							</div>
						{/each}
					{:else}
						<p class="no-skills">No skills available</p>
					{/if}
				</div>
			</div>
		</div>
	{:else}
		<div class="not-found">
			<h2>Weapon Not Found</h2>
			<p>The weapon you're looking for could not be found.</p>
			<button onclick={() => goto('/database/weapons')}>Back to Weapons</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.weapon-detail {
		padding: spacing.$unit-2x 0;
	}

	.page-header {
		margin-bottom: spacing.$unit-2x;

		.back-button {
			background: #f8f9fa;
			border: 1px solid #dee2e6;
			padding: spacing.$unit * 0.5 spacing.$unit;
			border-radius: 4px;
			cursor: pointer;
			font-size: typography.$font-small;
			margin-bottom: spacing.$unit;
			transition: all 0.2s;

			&:hover {
				background: #e9ecef;
			}
		}

		h1 {
			font-size: typography.$font-xxlarge;
			font-weight: typography.$bold;
			margin: 0;
		}
	}

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		button {
			background: #007bff;
			color: white;
			border: none;
			padding: spacing.$unit * 0.5 spacing.$unit;
			border-radius: 4px;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				background: #0056b3;
			}
		}
	}

	.weapon-content {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.weapon-skills {
		padding: spacing.$unit * 2;
		border-bottom: 1px solid #e5e5e5;

		&:last-child {
			border-bottom: none;
		}

		h3 {
			font-size: typography.$font-large;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
		}

		.skills-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: spacing.$unit;

			.skill-item {
				padding: spacing.$unit;
				background: #f8f9fa;
				border-radius: 4px;

				.skill-name {
					font-size: typography.$font-medium;
					font-weight: typography.$medium;
					margin: 0 0 spacing.$unit * 0.5 0;
					color: #333;
				}

				.skill-description {
					font-size: typography.$font-small;
					color: #666;
					margin: 0;
					line-height: 1.4;
				}
			}

			.no-skills {
				grid-column: 1 / -1;
				text-align: center;
				color: #666;
				font-style: italic;
			}
		}
	}

	@media (max-width: 768px) {
		.skills-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
