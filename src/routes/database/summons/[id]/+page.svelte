<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getElementLabel, getElementIcon } from '$lib/utils/element'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Get summon from server data
	const summon = $derived(data.summon)

	// Helper function to get summon name
	function getSummonName(nameObj: any): string {
		if (!nameObj) return 'Unknown Summon'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || 'Unknown Summon'
	}

	// Helper function to get summon image
	function getSummonImage(summon: any): string {
		if (!summon?.granblue_id) return '/images/placeholders/placeholder-summon-main.png'
		return `/images/summon-main/${summon.granblue_id}.jpg`
	}
</script>

<div class="summon-detail">
	<div class="page-header">
		<button class="back-button" onclick={() => goto('/database/summons')}>
			← Back to Summons
		</button>
		<h1>Summon Details</h1>
	</div>

	{#if summon}
		<div class="summon-content">
			<div class="summon-hero">
				<div class="summon-image">
					<img
						src={getSummonImage(summon)}
						alt={getSummonName(summon.name)}
						onerror={(e) => { e.currentTarget.src = '/images/placeholders/placeholder-summon-main.png' }}
					/>
				</div>
				<div class="summon-info">
					<h2 class="summon-name">{getSummonName(summon.name)}</h2>
					<div class="summon-meta">
						<div class="meta-item">
							<span class="label">Rarity:</span>
							<span class="value">{getRarityLabel(summon.rarity)}</span>
						</div>
						<div class="meta-item">
							<span class="label">Element:</span>
							<div class="element-display">
								{#if summon.element}
									<img
										src={getElementIcon(summon.element)}
										alt={getElementLabel(summon.element)}
										class="element-icon"
									/>
									<span class="value">{getElementLabel(summon.element)}</span>
								{:else}
									<span class="value">—</span>
								{/if}
							</div>
						</div>
						<div class="meta-item">
							<span class="label">Max Level:</span>
							<span class="value">{summon.max_level || '—'}</span>
						</div>
						<div class="meta-item">
							<span class="label">Granblue ID:</span>
							<span class="value">{summon.granblue_id || '—'}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="summon-details">
				<h3>Stats</h3>
				<div class="details-grid">
					<div class="detail-item">
						<span class="label">Base HP:</span>
						<span class="value">{summon.base_hp || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Base Attack:</span>
						<span class="value">{summon.base_attack || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Max HP:</span>
						<span class="value">{summon.max_hp || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Max Attack:</span>
						<span class="value">{summon.max_attack || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Plus Bonus:</span>
						<span class="value">{summon.plus_bonus ? 'Yes' : 'No'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Series:</span>
						<span class="value">{summon.series || '—'}</span>
					</div>
				</div>
			</div>

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
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.summon-detail {
		padding: spacing.$unit * 2;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: spacing.$unit * 2;

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

	.loading,
	.error,
	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		.loading-spinner {
			font-size: typography.$font-medium;
			color: #666;
		}

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

	.summon-content {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.summon-hero {
		display: flex;
		gap: spacing.$unit * 2;
		padding: spacing.$unit * 2;
		border-bottom: 1px solid #e5e5e5;

		.summon-image {
			flex-shrink: 0;

			img {
				width: 200px;
				height: auto;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
		}

		.summon-info {
			flex: 1;

			.summon-name {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit 0;
				color: #333;
			}

			.summon-meta {
				display: flex;
				flex-direction: column;
				gap: spacing.$unit * 0.5;

				.meta-item {
					display: flex;
					align-items: center;
					gap: spacing.$unit * 0.5;

					.label {
						font-weight: typography.$medium;
						color: #666;
						min-width: 100px;
					}

					.value {
						color: #333;
					}

					.element-display {
						display: flex;
						align-items: center;
						gap: spacing.$unit * 0.25;

						.element-icon {
							width: 25px;
							height: auto;
						}
					}
				}
			}
		}
	}

	.summon-details,
	.summon-abilities {
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

		.details-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: spacing.$unit;

			.detail-item {
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: spacing.$unit * 0.5;
				background: #f8f9fa;
				border-radius: 4px;

				.label {
					font-weight: typography.$medium;
					color: #666;
				}

				.value {
					color: #333;
				}
			}
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

	@media (max-width: 768px) {
		.summon-hero {
			flex-direction: column;

			.summon-image img {
				width: 150px;
			}
		}

		.details-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
