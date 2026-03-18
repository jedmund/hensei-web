<script lang="ts">
	// Components
	import * as m from '$lib/paraglide/messages'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import Button from './Button.svelte'
	import { getJobTierName } from '$lib/utils/jobUtils'
	import { getPlaceholderImage, getBasePath } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import { getElementKey } from '$lib/utils/element'

	// Props
	interface Props {
		type: 'character' | 'summon' | 'weapon' | 'job' | 'raid' | 'accessory'
		item: any // The character/summon/weapon/job object
		image: string
		editUrl?: string // URL to navigate to for editing (view mode)
		showEdit?: boolean // Whether to show the edit button
		editMode?: boolean // Whether currently in edit mode
		onSave?: () => void // Save handler
		onCancel?: () => void // Cancel handler
		isSaving?: boolean // Whether currently saving
	}

	let {
		type,
		item,
		image,
		editUrl,
		showEdit = false,
		editMode = false,
		onSave,
		onCancel,
		isSaving = false
	}: Props = $props()

	// Extract commonly used fields
	const name = $derived(item?.name)
	const element = $derived(item?.element)
	const proficiency = $derived(item?.proficiency)
	const maxLevel = $derived(item?.max_level)
	const granblueId = $derived(item?.granblue_id)

	// Get element name for button styling
	const elementName = $derived(
		element ? getElementKey(element) : undefined
	)

	// Helper function to get display name
	function getDisplayName(nameObj: string | { en?: string; ja?: string }): string {
		return localizedName(nameObj)
	}
</script>

<header class="container">
	<div class="left">
		<div class="image" class:job={type === 'job'} class:accessory={type === 'accessory'}>
			<img
				src={image}
				alt={getDisplayName(name)}
				onerror={(e) => {
					const placeholder =
						type === 'job'
							? `${getBasePath()}/placeholders/placeholder-job.png`
							: type === 'raid'
								? `${getBasePath()}/placeholders/placeholder-raid-thumbnail.png`
								: type === 'accessory'
									? `${getBasePath()}/placeholders/placeholder-weapon-grid.png`
									: getPlaceholderImage(type, 'main')
					;(e.currentTarget as HTMLImageElement).src = placeholder
				}}
			/>
		</div>

		<div class="info">
			<h2>{getDisplayName(name)}</h2>
			<div class="meta">
				{#if type === 'job'}
					<span class="job-tier">{getJobTierName(item?.row)}</span>
				{:else}
					{#if element !== undefined}
						<ElementLabel {element} size="medium" />
					{/if}
					{#if (type === 'character' || type === 'weapon') && proficiency}
						{#if Array.isArray(proficiency)}
							{#if proficiency[0] !== undefined}
								<ProficiencyLabel proficiency={proficiency[0]} size="medium" />
							{/if}
							{#if proficiency[1] !== undefined}
								<ProficiencyLabel proficiency={proficiency[1]} size="medium" />
							{/if}
						{:else if proficiency !== undefined}
							<ProficiencyLabel {proficiency} size="medium" />
						{/if}
					{/if}
				{/if}
			</div>
		</div>
	</div>

	{#if showEdit}
		<div class="right">
			{#if editMode}
				<Button variant="secondary" size="medium" onclick={onCancel} disabled={isSaving}>
					Cancel
				</Button>
				<Button
					variant="primary"
					size="medium"
					element={elementName as
						| 'fire'
						| 'water'
						| 'earth'
						| 'wind'
						| 'light'
						| 'dark'
						| undefined}
					onclick={onSave}
					disabled={isSaving}
				>
					{isSaving ? m.action_saving() : m.action_save()}
				</Button>
			{:else if editUrl}
				<Button variant="secondary" size="medium" href={editUrl}>{m.action_edit()}</Button>
			{/if}
		</div>
	{/if}
</header>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;

		.left {
			display: flex;
			align-items: center;
			gap: spacing.$unit-2x;
		}

		.right {
			display: flex;
			gap: spacing.$unit;
			align-items: center;
		}

		.image {
			flex-shrink: 0;

			img {
				width: 128px;
				height: auto;
				border-radius: layout.$item-corner;
			}

			&.job img {
				width: 32px;
				height: auto;
			}

			&.accessory img {
				width: 96px;
				height: auto;
			}
		}

		.info {
			flex: 1;

			h2 {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit 0;
				color: var(--text-primary);
			}

			.meta {
				display: flex;
				flex-direction: row;
				gap: spacing.$unit;
				align-items: center;
			}

			.job-tier {
				font-size: typography.$font-small;
				color: var(--text-secondary);
			}
		}
	}

	@media (max-width: 768px) {
		.container {
			flex-direction: column;

			.image img {
				width: 80px;
			}
		}
	}
</style>
