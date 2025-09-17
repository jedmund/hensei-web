<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getElementLabel, getElementIcon } from '$lib/utils/element'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DetailsHeader from '$lib/components/ui/DetailsHeader.svelte'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Get summon from server data
	const summon = $derived(data.summon)

	// Helper function to get summon image
	function getSummonImage(summon: any): string {
		if (!summon?.granblue_id) return '/images/placeholders/placeholder-summon-main.png'
		return `/images/summon-grid/${summon.granblue_id}.jpg`
	}

	// Calculate uncap properties for the indicator
	const uncap = $derived(summon?.uncap ?? {})
	const flb = $derived(uncap.flb ?? false)
	const ulb = $derived(uncap.ulb ?? false)
	const transcendence = $derived(uncap.transcendence ?? false)

	// Calculate maximum uncap level based on available uncaps
	// Summons: 3 base + FLB + ULB + transcendence
	const getMaxUncapLevel = () => {
		return transcendence ? 6 : ulb ? 5 : flb ? 4 : 3
	}

	const uncapLevel = $derived(getMaxUncapLevel())
	// For details view, show maximum transcendence stage when available
	const transcendenceStage = $derived(transcendence ? 5 : 0)
</script>

<div class="summon-detail">
	{#if summon}
		<div class="summon-content">
			<DetailsHeader type="summon" item={summon} image={getSummonImage(summon)} />

			<DetailsContainer title="HP Stats">
				<DetailItem label="Base HP" value={summon.hp?.min_hp} />
				<DetailItem label="Max HP" value={summon.hp?.max_hp} />
				{#if flb}
					<DetailItem label="Max HP (FLB)" value={summon.hp?.max_hp_flb} />
				{/if}
				{#if ulb}
					<DetailItem label="Max HP (ULB)" value={summon.hp?.max_hp_ulb} />
				{/if}
				{#if transcendence}
					<DetailItem label="Max HP (XLB)" value={summon.hp?.max_hp_xlb} />
				{/if}
			</DetailsContainer>

			<DetailsContainer title="Attack Stats">
				<DetailItem label="Base Attack" value={summon.atk?.min_atk} />
				<DetailItem label="Max Attack" value={summon.atk?.max_atk} />
				{#if flb}
					<DetailItem label="Max Attack (FLB)" value={summon.atk?.max_atk_flb} />
				{/if}
				{#if ulb}
					<DetailItem label="Max Attack (ULB)" value={summon.atk?.max_atk_ulb} />
				{/if}
				{#if transcendence}
					<DetailItem label="Max Attack (XLB)" value={summon.atk?.max_atk_xlb} />
				{/if}
			</DetailsContainer>

			<DetailsContainer title="Details">
				<DetailItem label="Series" value={summon.series} />
				{#if summon.uncap}
					<DetailItem label="Uncap">
						<UncapIndicator
							type="summon"
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

			<div class="summon-abilities">
				<h3>Call Effect</h3>
				<div class="abilities-section">
					{#if summon.call_name || summon.call_description}
						<div class="ability-item">
							<h4 class="ability-name">{summon.call_name || 'Call Effect'}</h4>
							<p class="ability-description">
								{summon.call_description || 'No description available'}
							</p>
						</div>
					{:else}
						<p class="no-abilities">No call effect information available</p>
					{/if}
				</div>

				<h3>Aura Effect</h3>
				<div class="abilities-section">
					{#if summon.aura_name || summon.aura_description}
						<div class="ability-item">
							<h4 class="ability-name">{summon.aura_name || 'Aura Effect'}</h4>
							<p class="ability-description">
								{summon.aura_description || 'No description available'}
							</p>
						</div>
					{:else}
						<p class="no-abilities">No aura effect information available</p>
					{/if}
				</div>

				{#if summon.sub_aura_name || summon.sub_aura_description}
					<h3>Sub Aura Effect</h3>
					<div class="abilities-section">
						<div class="ability-item">
							<h4 class="ability-name">{summon.sub_aura_name || 'Sub Aura Effect'}</h4>
							<p class="ability-description">
								{summon.sub_aura_description || 'No description available'}
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{:else}
		<div class="not-found">
			<h2>Summon Not Found</h2>
			<p>The summon you're looking for could not be found.</p>
			<button onclick={() => goto('/database/summons')}>Back to Summons</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.summon-detail {
		padding: spacing.$unit-2x 0;
	}

	.page-header {
		margin-bottom: spacing.$unit-2x;

		.back-button {
			background: #f8f9fa;
			border: 1px solid #dee2e6;
			padding: spacing.$unit-half spacing.$unit;
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
			padding: spacing.$unit-half spacing.$unit;
			border-radius: 4px;
			cursor: pointer;
			margin-top: spacing.$unit;

			&:hover {
				background: #0056b3;
			}
		}
	}

	.summon-content {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.summon-abilities {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid #e5e5e5;

		&:last-child {
			border-bottom: none;
		}

		h3 {
			font-size: typography.$font-large;
			font-weight: typography.$bold;
			margin: 0 0 spacing.$unit 0;
		}

		.abilities-section {
			margin-bottom: spacing.$unit * 2;

			&:last-child {
				margin-bottom: 0;
			}

			.ability-item {
				padding: spacing.$unit;
				background: #f8f9fa;
				border-radius: 4px;

				.ability-name {
					font-size: typography.$font-medium;
					font-weight: typography.$medium;
					margin: 0 0 spacing.$unit * 0.5 0;
					color: #333;
				}

				.ability-description {
					font-size: typography.$font-small;
					color: #666;
					margin: 0;
					line-height: 1.4;
				}
			}

			.no-abilities {
				text-align: center;
				color: #666;
				font-style: italic;
				padding: spacing.$unit;
			}
		}
	}
</style>
