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
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'

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
			<img class="job-portrait" src={jobImageUrl} alt={localizedName(job.name)} />
			<div class="overlay"></div>
		{:else}
			<div class="empty-portrait"></div>
		{/if}

		{#if job?.accessory && accessory}
			<Tooltip content={localizedName(accessory.name)}>
				<button
					class="accessory-button"
					onclick={canEdit ? onSelectAccessory : undefined}
					class:interactive={canEdit}
					aria-label={localizedName(accessory.name)}
				>
					<img
						src={getAccessoryImage(accessory.granblueId)}
						alt={localizedName(accessory.name)}
						class="accessory-button-img"
					/>
				</button>
			</Tooltip>
		{:else if canEdit && job?.accessory}
			<Tooltip content={m.party_job_select_accessory()}>
				<button class="accessory-button interactive" onclick={onSelectAccessory} aria-label={m.party_job_select_accessory()}>
					<Icon name="plus" size={16} />
				</button>
			</Tooltip>
		{/if}
	</div>

	<!-- Right: Job details and skills -->
	<div class="job-details">
		{#if job}
			<div class="job-header">
				{#if canEdit}
					<button class="job-name clickable" onclick={onSelectJob}>
						<div class="job-name-left">
							<img src={jobIconUrl} alt="{localizedName(job.name)} icon" class="job-icon" />
							<h3>{localizedName(job.name)}</h3>
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
						<Icon name="chevron-right" size={16} />
					</button>
				{:else}
					<div class="job-name">
						<div class="job-name-left">
							<img src={jobIconUrl} alt="{localizedName(job.name)} icon" class="job-icon" />
							<h3>{localizedName(job.name)}</h3>
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

			{:else}
			<div class="no-job-message" class:readonly={!canEdit}>
				{#if canEdit}
					<Button onclick={onSelectJob} small>{m.job_choose()}</Button>
				{:else}
					<p>{m.party_job_no_job()}</p>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/colors' as colors;

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
			z-index: effects.$z-badge;
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
			z-index: effects.$z-raised;
			pointer-events: none;
		}

		.empty-portrait {
			z-index: effects.$z-badge;
		}

		.accessory-button {
			position: absolute;
			top: spacing.$unit;
			right: spacing.$unit;
			z-index: effects.$z-badge;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 64px;
			height: 64px;
			padding: 0;
			background: var(--button-contained-bg);
			color: var(--text-tertiary);
			border: none;
			border-radius: 0;
			box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
			cursor: default;
			transition: background 0.2s ease;
			overflow: hidden;

			&.interactive {
				cursor: pointer;

				&:hover {
					background: var(--button-contained-bg-hover);
				}
			}

			.accessory-button-img {
				width: 100%;
				height: 100%;
				object-fit: cover;
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
				padding: spacing.$unit calc(spacing.$unit * 1.5) spacing.$unit spacing.$unit;
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

				.job-name-left {
					display: flex;
					align-items: center;
					gap: spacing.$unit-half;
				}

				.job-icon {
					height: 32px;
				}

				h3 {
					margin: 0;
					font-size: typography.$font-body;
					font-weight: typography.$medium;
					color: var(--text-primary);
				}

				:global(svg) {
					color: var(--text-tertiary);
					flex-shrink: 0;
				}
			}

			.job-badges {
				display: flex;
				gap: spacing.$unit-half;

				.badge {
					padding: spacing.$unit-quarter spacing.$unit;
					border-radius: layout.$item-corner;
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
			}
		}

		.job-skills {
			display: flex;
			flex-direction: column;
			flex: 1;
		}

		.no-job-message {
			display: flex;
			align-items: center;
			justify-content: center;
			height: 100%;
			color: var(--text-tertiary);
			font-size: typography.$font-body;

			&.readonly {
				color: var(--text-secondary);
			}
		}
	}
</style>
