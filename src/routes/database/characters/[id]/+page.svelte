<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getElementLabel, getElementIcon } from '$lib/utils/element'
	import { getRaceLabel } from '$lib/utils/race'
	import { getGenderLabel } from '$lib/utils/gender'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Get character from server data
	const character = $derived(data.character)

	// Helper function to get character name
	function getCharacterName(nameObj: any): string {
		if (!nameObj) return 'Unknown Character'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || 'Unknown Character'
	}

	// Helper function to get character image
	function getCharacterImage(character: any): string {
		if (!character?.granblue_id) return '/images/placeholders/placeholder-character-main.png'
		return `/images/character-main/${character.granblue_id}_01.jpg`
	}
</script>

<div class="character-detail">
	<div class="page-header">
		<button class="back-button" onclick={() => goto('/database/characters')}>
			← Back to Characters
		</button>
		<h1>Character Details</h1>
	</div>

	{#if character}
		<div class="character-content">
			<div class="character-hero">
				<div class="character-image">
					<img
						src={getCharacterImage(character)}
						alt={getCharacterName(character.name)}
						onerror={(e) => { e.currentTarget.src = '/images/placeholders/placeholder-character-main.png' }}
					/>
				</div>
				<div class="character-info">
					<h2 class="character-name">{getCharacterName(character.name)}</h2>
					<div class="character-meta">
						<div class="meta-item">
							<span class="label">Rarity:</span>
							<span class="value">{getRarityLabel(character.rarity)}</span>
						</div>
						<div class="meta-item">
							<span class="label">Element:</span>
							<div class="element-display">
								{#if character.element}
									<img
										src={getElementIcon(character.element)}
										alt={getElementLabel(character.element)}
										class="element-icon"
									/>
									<span class="value">{getElementLabel(character.element)}</span>
								{:else}
									<span class="value">—</span>
								{/if}
							</div>
						</div>
						<div class="meta-item">
							<span class="label">Max Level:</span>
							<span class="value">{character.max_level || '—'}</span>
						</div>
						<div class="meta-item">
							<span class="label">Granblue ID:</span>
							<span class="value">{character.granblue_id || '—'}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="character-details">
				<h3>Details</h3>
				<div class="details-grid">
					<div class="detail-item">
						<span class="label">Race:</span>
						<span class="value">{getRaceLabel(character.race)}</span>
					</div>
					<div class="detail-item">
						<span class="label">Gender:</span>
						<span class="value">{getGenderLabel(character.gender)}</span>
					</div>
					<div class="detail-item">
						<span class="label">Base HP:</span>
						<span class="value">{character.base_hp || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Base Attack:</span>
						<span class="value">{character.base_attack || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Max HP:</span>
						<span class="value">{character.max_hp || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Max Attack:</span>
						<span class="value">{character.max_attack || '—'}</span>
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div class="not-found">
			<h2>Character Not Found</h2>
			<p>The character you're looking for could not be found.</p>
			<button onclick={() => goto('/database/characters')}>Back to Characters</button>
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.character-detail {
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

	.character-content {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.character-hero {
		display: flex;
		gap: spacing.$unit * 2;
		padding: spacing.$unit * 2;
		border-bottom: 1px solid #e5e5e5;

		.character-image {
			flex-shrink: 0;

			img {
				width: 200px;
				height: auto;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
		}

		.character-info {
			flex: 1;

			.character-name {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit 0;
				color: #333;
			}

			.character-meta {
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

	.character-details {
		padding: spacing.$unit * 2;

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
	}

	@media (max-width: 768px) {
		.character-hero {
			flex-direction: column;

			.character-image img {
				width: 150px;
			}
		}

		.details-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
