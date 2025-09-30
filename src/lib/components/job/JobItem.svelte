<script lang="ts">
	import type { Job } from '$lib/types/api/entities'
	import { getJobIconUrl, formatJobProficiency } from '$lib/utils/jobUtils'
	import ProficiencyLabel from '../labels/ProficiencyLabel.svelte'

	interface Props {
		job: Job
		selected?: boolean
		onClick?: () => void
	}

	let { job, selected = false, onClick }: Props = $props()

	const proficiencies = $derived(formatJobProficiency(job.proficiency))
</script>

<button
	class="job-item"
	class:selected
	on:click={onClick}
	aria-pressed={selected}
	aria-label="{job.name.en} - {selected ? 'Currently selected' : 'Click to select'}"
>
	<img src={getJobIconUrl(job.granblueId)} alt={job.name.en} class="job-icon" loading="lazy" />

	<div class="job-info">
		<span class="job-name">{job.name.en}</span>

		<div class="job-details">
			{#if job.ultimateMastery}
				<span class="badge ultimate">UM</span>
			{/if}

			{#if proficiencies.length > 0}
				<div class="proficiencies">
					{#each job.proficiency as prof}
						{#if prof > 0}
							<ProficiencyLabel proficiency={prof} size="small" />
						{/if}
					{/each}
				</div>
			{/if}
		</div>
	</div>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.job-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-2x spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;

		&:hover {
			background: var(--button-contained-bg-hover);
		}

		&.selected {
			background: var(--primary-10);

			&::before {
				content: '';
				position: absolute;
				left: 0;
				top: 0;
				bottom: 0;
				width: 3px;
				background: var(--primary-50);
				border-radius: layout.$item-corner 0 0 layout.$item-corner;
			}
		}

		position: relative;

		.job-icon {
			// Display at native size (job icons are typically 48x48px)
			width: auto;
			height: 24px;
			max-width: 48px;
			max-height: 48px;
			border-radius: 4px;
			flex-shrink: 0;
			object-fit: contain;
		}

		.job-info {
			flex: 1;
			display: flex;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
			gap: 4px;
			min-width: 0;

			.job-name {
				font-size: typography.$font-regular;
				font-weight: typography.$medium;
				color: var(--text-primary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.job-details {
				display: flex;
				align-items: center;
				gap: spacing.$unit-half;

				.badge {
					display: inline-block;
					padding: 2px 6px;
					border-radius: 8px;
					font-size: typography.$font-small;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.5px;
					flex-shrink: 0;

					&.master {
						background: var(--badge-master-bg, #ffd700);
						color: var(--badge-master-text, #000);
					}

					&.ultimate {
						background: var(--badge-ultimate-bg, #9b59b6);
						color: var(--badge-ultimate-text, #fff);
					}
				}

				.proficiencies {
					display: flex;
					gap: spacing.$unit-half;
					align-items: center;
					overflow: hidden;
				}
			}
		}
	}
</style>
