<script lang="ts">
	import type { Job } from '$lib/types/api/entities'
	import {
		getJobIconUrl,
		getJobWideImageUrl,
		formatJobProficiency,
		Gender
	} from '$lib/utils/jobUtils'
	import { localizedName } from '$lib/utils/locale'
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
	onclick={onClick}
	aria-pressed={selected}
	aria-label="{localizedName(job.name)} - {selected ? 'Currently selected' : 'Click to select'}"
>
	<div class="job-image-container">
		<img
			src={getJobWideImageUrl(job, Gender.Gran)}
			alt={localizedName(job.name)}
			class="job-wide"
			loading="lazy"
		/>
	</div>

	<div class="job-info">
		<span class="job-name">{localizedName(job.name)}</span>

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

	<div class="job-right">
		{#if job.ultimateMastery}
			<span class="badge ultimate">UM</span>
		{/if}
		<img src={getJobIconUrl(job.granblueId)} alt="" class="job-icon" loading="lazy" />
	</div>
</button>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/colors' as colors;

	.job-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
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

		.job-image-container {
			position: relative;
			width: 120px;
			border-radius: layout.$item-corner;
			overflow: hidden;
			flex-shrink: 0;

			.job-wide {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
			}
		}

		.job-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: spacing.$unit-half;
			min-width: 0;

			.job-name {
				font-size: typography.$font-regular;
				font-weight: typography.$medium;
				color: var(--text-primary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}

			.proficiencies {
				display: flex;
				gap: spacing.$unit-half;
				align-items: center;
				overflow: hidden;
			}
		}

		.job-right {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			flex-shrink: 0;

			.badge {
				display: inline-block;
				padding: 2px 6px;
				border-radius: layout.$input-corner;
				font-size: typography.$font-small;
				font-weight: typography.$bold;
				text-transform: uppercase;
				letter-spacing: 0.5px;

				&.master {
					background: var(--badge-master-bg, colors.$gold);
					color: var(--badge-master-text, #000);
				}

				&.ultimate {
					background: var(--badge-ultimate-bg, #9b59b6);
					color: var(--badge-ultimate-text, #fff);
				}
			}

			.job-icon {
				width: 28px;
				height: 28px;
				border-radius: layout.$item-corner;
				object-fit: contain;
			}
		}
	}
</style>
