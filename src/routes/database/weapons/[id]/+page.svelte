<svelte:options runes={true} />

<script lang="ts">
	import { goto } from '$app/navigation'
	import { getRarityLabel } from '$lib/utils/rarity'
	import { getElementLabel, getElementIcon } from '$lib/utils/element'
	import { getProficiencyLabel, getProficiencyIcon } from '$lib/utils/proficiency'
	import type { PageData } from './$types'

	let { data }: { data: PageData } = $props()

	// Get weapon from server data
	const weapon = $derived(data.weapon)

	// Helper function to get weapon name
	function getWeaponName(nameObj: any): string {
		if (!nameObj) return 'Unknown Weapon'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || 'Unknown Weapon'
	}

	// Helper function to get weapon image
	function getWeaponImage(weapon: any): string {
		if (!weapon?.granblue_id) return '/images/placeholders/placeholder-weapon-main.png'

		// Handle element-specific weapons (primal weapons)
		if (weapon.element === 0 && weapon.instance_element) {
			return `/images/weapon-main/${weapon.granblue_id}_${weapon.instance_element}.jpg`
		}
		return `/images/weapon-main/${weapon.granblue_id}.jpg`
	}
</script>

<div class="weapon-detail">
	<div class="page-header">
		<button class="back-button" onclick={() => goto('/database/weapons')}>
			← Back to Weapons
		</button>
		<h1>Weapon Details</h1>
	</div>

	{#if weapon}
		<div class="weapon-content">
			<div class="weapon-hero">
				<div class="weapon-image">
					<img
						src={getWeaponImage(weapon)}
						alt={getWeaponName(weapon.name)}
						onerror={(e) => {
							e.currentTarget.src = '/images/placeholders/placeholder-weapon-main.png'
						}}
					/>
				</div>
				<div class="weapon-info">
					<h2 class="weapon-name">{getWeaponName(weapon.name)}</h2>
					<div class="weapon-meta">
						<div class="meta-item">
							<span class="label">Rarity:</span>
							<span class="value">{getRarityLabel(weapon.rarity)}</span>
						</div>
						<div class="meta-item">
							<span class="label">Element:</span>
							<div class="element-display">
								{#if weapon.element}
									<img
										src={getElementIcon(weapon.element)}
										alt={getElementLabel(weapon.element)}
										class="element-icon"
									/>
									<span class="value">{getElementLabel(weapon.element)}</span>
								{:else}
									<span class="value">—</span>
								{/if}
							</div>
						</div>
						<div class="meta-item">
							<span class="label">Proficiency:</span>
							<div class="proficiency-display">
								{#if weapon.proficiency}
									<img
										src={getProficiencyIcon(weapon.proficiency)}
										alt={getProficiencyLabel(weapon.proficiency)}
										class="proficiency-icon"
									/>
									<span class="value">{getProficiencyLabel(weapon.proficiency)}</span>
								{:else}
									<span class="value">—</span>
								{/if}
							</div>
						</div>
						<div class="meta-item">
							<span class="label">Max Level:</span>
							<span class="value">{weapon.max_level || '—'}</span>
						</div>
						<div class="meta-item">
							<span class="label">Granblue ID:</span>
							<span class="value">{weapon.granblue_id || '—'}</span>
						</div>
					</div>
				</div>
			</div>

			<div class="weapon-details">
				<h3>Stats</h3>
				<div class="details-grid">
					<div class="detail-item">
						<span class="label">Base HP:</span>
						<span class="value">{weapon.base_hp || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Base Attack:</span>
						<span class="value">{weapon.base_attack || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Max HP:</span>
						<span class="value">{weapon.max_hp || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Max Attack:</span>
						<span class="value">{weapon.max_attack || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Skill Level Cap:</span>
						<span class="value">{weapon.skill_level_cap || '—'}</span>
					</div>
					<div class="detail-item">
						<span class="label">Plus Bonus:</span>
						<span class="value">{weapon.plus_bonus ? 'Yes' : 'No'}</span>
					</div>
				</div>
			</div>

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
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.weapon-detail {
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

	.weapon-content {
		background: white;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		overflow: hidden;
	}

	.weapon-hero {
		display: flex;
		gap: spacing.$unit * 2;
		padding: spacing.$unit * 2;
		border-bottom: 1px solid #e5e5e5;

		.weapon-image {
			flex-shrink: 0;

			img {
				width: 200px;
				height: auto;
				border-radius: 8px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}
		}

		.weapon-info {
			flex: 1;

			.weapon-name {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit 0;
				color: #333;
			}

			.weapon-meta {
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

					.element-display,
					.proficiency-display {
						display: flex;
						align-items: center;
						gap: spacing.$unit * 0.25;

						.element-icon,
						.proficiency-icon {
							width: 25px;
							height: auto;
						}
					}
				}
			}
		}
	}

	.weapon-details,
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
		.weapon-hero {
			flex-direction: column;

			.weapon-image img {
				width: 150px;
			}
		}

		.details-grid,
		.skills-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
