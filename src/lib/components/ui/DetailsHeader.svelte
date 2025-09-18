<svelte:options runes={true} />

<script lang="ts">
	// Components
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import Button from './Button.svelte'

	// Props
	interface Props {
		type: 'character' | 'summon' | 'weapon'
		item: any // The character/summon/weapon object
		image: string
		onEdit?: () => void // Optional edit handler
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
		onEdit,
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
	const elementName = $derived((() => {
		const elementMap: Record<number, string> = {
			0: undefined, // Null element
			1: 'wind',
			2: 'fire',
			3: 'water',
			4: 'earth',
			5: 'dark',
			6: 'light'
		}
		return elementMap[element] || undefined
	})())

	// Helper function to get display name
	function getDisplayName(nameObj: string | { en?: string; ja?: string }): string {
		if (!nameObj) return 'Unknown'
		if (typeof nameObj === 'string') return nameObj
		return nameObj.en || nameObj.ja || 'Unknown'
	}
</script>

<section class="container">
	<div class="left">
		<div class="image">
			<img
				src={image}
				alt={getDisplayName(name)}
				onerror={(e) => {
					const placeholder =
						type === 'character'
							? '/images/placeholders/placeholder-character-main.png'
							: type === 'summon'
								? '/images/placeholders/placeholder-summon-main.png'
								: '/images/placeholders/placeholder-weapon-main.png'
					;(e.currentTarget as HTMLImageElement).src = placeholder
				}}
			/>
		</div>

		<div class="info">
			<h2>{getDisplayName(name)}</h2>
			<div class="meta">
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
					element={elementName}
					onclick={onSave}
					disabled={isSaving}
				>
					{isSaving ? 'Saving...' : 'Save'}
				</Button>
			{:else}
				<Button variant="secondary" size="medium" onclick={onEdit}>Edit</Button>
			{/if}
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit * 2;
		padding: spacing.$unit * 2;
		border-bottom: 1px solid #e5e5e5;
		position: sticky;
		top: 0;
		z-index: 10;
		background: white;
		border-top-left-radius: layout.$card-corner;
		border-top-right-radius: layout.$card-corner;

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
		}

		.info {
			flex: 1;

			h2 {
				font-size: typography.$font-xlarge;
				font-weight: typography.$bold;
				margin: 0 0 spacing.$unit 0;
				color: colors.$grey-30;
			}

			.meta {
				display: flex;
				flex-direction: row;
				gap: spacing.$unit;
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
