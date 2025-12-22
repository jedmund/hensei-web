<script lang="ts">
	import type { Job, JobAccessory } from '$lib/types/api/entities'
	import type { JobSkillList } from '$lib/types/api/party'
	import JobSkillSlot from './JobSkillSlot.svelte'
	import {
		getJobSkillSlotCount,
		getJobIconUrl,
		getJobFullImageUrl,
		Gender,
		isSkillSlotAvailable,
		isSkillSlotLocked
	} from '$lib/utils/jobUtils'
	import { getAccessoryImage, getBasePath } from '$lib/utils/images'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		job?: Job | undefined
		jobSkills?: JobSkillList | undefined
		accessory?: JobAccessory | undefined
		canEdit?: boolean | undefined
		gender?: Gender | undefined
		element?: number | undefined
		onSelectJob?: (() => void) | undefined
		onSelectSkill?: ((slot: number) => void) | undefined
		onRemoveSkill?: ((slot: number) => void) | undefined
		onSelectAccessory?: (() => void) | undefined
	}

	let {
		job,
		jobSkills = {},
		accessory,
		canEdit = false,
		gender = Gender.Gran,
		element,
		onSelectJob,
		onSelectSkill,
		onRemoveSkill,
		onSelectAccessory
	}: Props = $props()

	const slotCount = $derived(getJobSkillSlotCount(job))
	const jobIconUrl = $derived(job ? getJobIconUrl(job.granblueId) : '')
	const jobImageUrl = $derived(job ? getJobFullImageUrl(job, gender) : '')
	const jobBackgroundUrl = `${getBasePath()}/background_a.jpg`

	function handleSelectSkill(slot: number) {
		if (onSelectSkill) {
			onSelectSkill(slot)
		}
	}

	function handleRemoveSkill(slot: number) {
		if (onRemoveSkill) {
			onRemoveSkill(slot)
		}
	}
</script>

<div class="job-section">
	<div class="job-image-container" style:background-image="url({jobBackgroundUrl})">
		{#if job}
			<img class="job-portrait" src={jobImageUrl} alt={job.name.en} />
			<div class="overlay"></div>
		{:else}
			<div class="empty-portrait"></div>
		{/if}

		{#if canEdit && job}
			<button class="change-job-button" onclick={onSelectJob} aria-label="Change job">
				<Icon name="arrow-left" size={16} />
			</button>
		{/if}
	</div>

	<!-- Right: Job details and skills -->
	<div class="job-details">
		{#if job}
			<div class="job-header">
				{#if canEdit}
					<button class="job-name clickable" onclick={onSelectJob}>
						<div class="job-name-row">
							<img src={jobIconUrl} alt="{job.name.en} icon" class="job-icon" />
							<h3>{job.name.en}</h3>
						</div>
						{#if job.masterLevel || job.ultimateMastery}
							<div class="job-badges">
								{#if job.masterLevel}
									<span class="badge master">ML</span>
								{/if}
								{#if job.ultimateMastery}
									<span class="badge ultimate">UM</span>
								{/if}
							</div>
						{/if}
					</button>
				{:else}
					<div class="job-name">
						<div class="job-name-row">
							<img src={jobIconUrl} alt="{job.name.en} icon" class="job-icon" />
							<h3>{job.name.en}</h3>
						</div>
						{#if job.masterLevel || job.ultimateMastery}
							<div class="job-badges">
								{#if job.masterLevel}
									<span class="badge master">ML</span>
								{/if}
								{#if job.ultimateMastery}
									<span class="badge ultimate">UM</span>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<div class="job-skills">
				{#each Array(4) as _, slot}
					{#if isSkillSlotAvailable(job, slot)}
						<JobSkillSlot
							skill={jobSkills[slot as keyof JobSkillList]}
							{slot}
							locked={isSkillSlotLocked(slot, job, jobSkills)}
							editable={canEdit}
							available={true}
							onclick={() => handleSelectSkill(slot)}
							onRemove={() => handleRemoveSkill(slot)}
						/>
					{/if}
				{/each}
			</div>

			{#if job.accessory}
				<div class="job-accessory">
					<div
						class="accessory-slot"
						class:empty={!accessory}
						class:editable={canEdit}
						role={canEdit ? 'button' : undefined}
						tabindex={canEdit ? 0 : undefined}
						onclick={() => canEdit && onSelectAccessory?.()}
						onkeydown={(e) => {
							if (canEdit && onSelectAccessory && (e.key === 'Enter' || e.key === ' ')) {
								e.preventDefault()
								onSelectAccessory()
							}
						}}
					>
						{#if accessory}
							<img
								src={getAccessoryImage(accessory.granblueId)}
								alt={accessory.name.en}
								class="accessory-icon"
							/>
							<span class="accessory-name">{accessory.name.en}</span>
						{:else}
							<Icon name="plus" size={16} />
							<span>Select Accessory</span>
						{/if}
					</div>
				</div>
			{/if}
		{:else}
			<div class="no-job-message" class:readonly={!canEdit}>
				{#if canEdit}
					<Button onclick={onSelectJob} small>{m.job_choose()}</Button>
				{:else}
					<p>No job selected</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.job-section {
		display: flex;
		gap: spacing.$unit-3x;
		padding: spacing.$unit-2x;
		background: var(--card-bg);
		border-radius: layout.$card-corner;
		border: 1px solid var(--border-subtle);
		width: 100%;
		box-sizing: border-box;

		@media (max-width: 800px) {
			flex-direction: column;
			align-items: center;
			gap: spacing.$unit-2x;
		}
	}

	.job-image-container {
		position: relative;
		flex-shrink: 0;
		width: 447px;
		max-width: 100%;
		height: 252px;
		aspect-ratio: 7/4;
		background-size: 500px 281px;
		background-position: center;
		border-radius: layout.$item-corner;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.2);
		overflow: hidden;
		isolation: isolate;
		display: flex;
		align-items: center;
		justify-content: center;

		@media (max-width: 800px) {
			width: 100%;
			height: auto;
			aspect-ratio: 16/9;
		}

		.job-portrait {
			position: relative;
			width: 100%;
			height: auto;
			object-fit: contain;
			z-index: 2;
			filter: drop-shadow(4px 4px 8px rgba(0, 0, 0, 0.48));
			transform: translateY(74px);
		}

		.overlay {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			backdrop-filter: blur(5px) saturate(100%) brightness(80%);
			z-index: 1;
			pointer-events: none;
		}

		.empty-portrait {
			z-index: 2;
		}

		.change-job-button {
			position: absolute;
			top: spacing.$unit;
			right: spacing.$unit;
			z-index: 3;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			height: 32px;
			padding: 0;
			background: rgba(0, 0, 0, 0.6);
			color: white;
			border: none;
			border-radius: layout.$card-corner;
			cursor: pointer;
			transition: background 0.2s ease;

			&:hover {
				background: rgba(0, 0, 0, 0.8);
			}
		}
	}

	.job-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		min-width: 0;

		.job-header {
			display: flex;
			flex-direction: column;
			gap: spacing.$unit;

			.job-name {
				display: flex;
				align-items: center;
				justify-content: space-between;
				gap: spacing.$unit;
				padding: spacing.$unit;
				border-radius: layout.$card-corner;
				width: 100%;
				border: none;
				background: transparent;
				font-family: inherit;
				text-align: left;
				transition: background 0.2s ease;

				&.clickable {
					cursor: pointer;
					background: var(--button-contained-bg);

					&:hover {
						background: var(--button-contained-bg-hover);
					}
				}

				.job-name-row {
					display: flex;
					align-items: center;
					gap: spacing.$unit-half;
				}

				.job-icon {
					width: 32px;
					height: 32px;
					border-radius: layout.$item-corner;
				}

				h3 {
					margin: 0;
					font-size: typography.$font-regular;
					font-weight: 600;
					color: var(--text-primary);
				}
			}

			.job-badges {
				display: flex;
				gap: spacing.$unit-half;

				.badge {
					padding: 2px 8px;
					border-radius: layout.$item-corner;
					font-size: typography.$font-small;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.5px;

					&.master {
						background: var(--badge-master-bg, #ffd700);
						color: var(--badge-master-text, #000);
					}

					&.ultimate {
						background: var(--badge-ultimate-bg, #9b59b6);
						color: var(--badge-ultimate-text, #fff);
					}
				}
			}
		}

		.job-skills {
			display: flex;
			flex-direction: column;
			flex: 1;
		}

		.job-accessory {
			.accessory-slot {
				display: flex;
				align-items: center;
				gap: spacing.$unit;
				padding: spacing.$unit;
				border: 1px solid var(--border-subtle);
				border-radius: layout.$item-corner;
				background: var(--card-bg);
				min-height: 48px;
				transition: all 0.2s ease;

				&.empty {
					border-style: dashed;
					background: var(--placeholder-bg);
					color: var(--text-tertiary);
					justify-content: center;
				}

				&.editable {
					cursor: pointer;

					&:hover {
						background: var(--button-contained-bg-hover);
						border-color: var(--border-medium);

						&.empty {
							border-style: solid;
						}
					}
				}

				.accessory-icon {
					width: 32px;
					height: 32px;
					border-radius: layout.$item-corner;
				}

				.accessory-name {
					font-size: typography.$font-regular;
					color: var(--text-primary);
				}
			}
		}

		.no-job-message {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: var(--text-tertiary);
			font-size: typography.$font-regular;

			&.readonly {
				color: var(--text-secondary);
			}
		}
	}
</style>
