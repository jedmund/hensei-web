
<script lang="ts">
	import { DropdownMenu } from 'bits-ui'
	import DetailsHeader from '$lib/components/ui/DetailsHeader.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { Snippet } from 'svelte'

	export type DetailTab = 'info' | 'images' | 'raw'

	interface Props {
		type: 'character' | 'summon' | 'weapon' | 'job' | 'raid' | 'accessory'
		item: any
		image: string
		showEdit?: boolean
		editUrl?: string
		editMode?: boolean
		isSaving?: boolean
		saveSuccess?: boolean
		saveError?: string | null
		onSave?: () => void
		onCancel?: () => void
		// Tab navigation
		currentTab?: DetailTab
		onTabChange?: (tab: DetailTab) => void
		showTabs?: boolean
		// Image download handlers
		onDownloadAllImages?: (force: boolean) => Promise<void>
		onDownloadSize?: (size: string) => Promise<void>
		availableSizes?: string[]
	}

	let {
		type,
		item,
		image,
		showEdit = false,
		editUrl,
		editMode = false,
		isSaving = false,
		saveSuccess = false,
		saveError = null,
		onSave,
		onCancel,
		currentTab = 'info',
		onTabChange,
		showTabs = true,
		onDownloadAllImages,
		onDownloadSize,
		availableSizes = [],
		children
	}: Props & { children: Snippet } = $props()

	let isDownloading = $state(false)
	let dropdownOpen = $state(false)

	function handleTabChange(value: string) {
		onTabChange?.(value as DetailTab)
	}

	async function handleDownloadAll(force: boolean) {
		if (!onDownloadAllImages) return
		isDownloading = true
		dropdownOpen = false
		try {
			await onDownloadAllImages(force)
		} finally {
			isDownloading = false
		}
	}

	async function handleDownloadSize(size: string) {
		if (!onDownloadSize) return
		isDownloading = true
		dropdownOpen = false
		try {
			await onDownloadSize(size)
		} finally {
			isDownloading = false
		}
	}

	// Show download button when on images tab and can edit
	const showDownloadDropdown = $derived(
		showEdit && currentTab === 'images' && onDownloadAllImages && !editMode
	)
</script>

<div class="content">
	<DetailsHeader
		{type}
		{item}
		{image}
		{editMode}
		{showEdit}
		{editUrl}
		onSave={onSave ?? (() => {})}
		onCancel={onCancel ?? (() => {})}
		{isSaving}
	/>

	{#if showTabs && !editMode}
		<div class="tab-navigation">
			<SegmentedControl
				value={currentTab}
				onValueChange={handleTabChange}
				variant="background"
				size="small"
			>
				<Segment value="info">Info</Segment>
				<Segment value="images">Images</Segment>
				<Segment value="raw">Raw Data</Segment>
			</SegmentedControl>

			{#if showDownloadDropdown}
				<div class="download-dropdown">
					<DropdownMenu.Root bind:open={dropdownOpen}>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button {...props} variant="secondary" size="small" disabled={isDownloading}>
									{isDownloading ? 'Downloading...' : 'Download Images'}
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>

						<DropdownMenu.Portal>
							<DropdownMenu.Content class="dropdown-menu" sideOffset={4}>
								<DropdownMenu.Item
									class="dropdown-menu-item"
									onclick={() => handleDownloadAll(false)}
								>
									Download All Images
								</DropdownMenu.Item>
								<DropdownMenu.Item
									class="dropdown-menu-item"
									onclick={() => handleDownloadAll(true)}
								>
									Re-download All Images
								</DropdownMenu.Item>
								{#if availableSizes.length > 0}
									<DropdownMenu.Separator class="dropdown-menu-separator" />
									{#each availableSizes as size}
										<DropdownMenu.Item
											class="dropdown-menu-item"
											onclick={() => handleDownloadSize(size)}
										>
											Download All "{size}" Images
										</DropdownMenu.Item>
									{/each}
								{/if}
							</DropdownMenu.Content>
						</DropdownMenu.Portal>
					</DropdownMenu.Root>
				</div>
			{/if}
		</div>
	{/if}

	{#if saveSuccess || saveError}
		<div class="edit-controls">
			{#if saveSuccess}
				<span class="success-message">Changes saved successfully!</span>
			{/if}
			{#if saveError}
				<span class="error-message">{saveError}</span>
			{/if}
		</div>
	{/if}

	{@render children?.()}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.content {
		overflow: visible;
		position: relative;
	}

	.tab-navigation {
		padding: spacing.$unit-2x;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: spacing.$unit;
	}

	.download-dropdown {
		margin-left: auto;
	}

	.edit-controls {
		padding: spacing.$unit-2x;
		border-bottom: 1px solid var(--border-medium);
		display: flex;
		gap: spacing.$unit;
		align-items: center;

		.success-message {
			color: var(--text-primary);
			font-size: typography.$font-small;
			animation: fadeIn effects.$duration-opacity-fade ease-in;
		}

		.error-message {
			color: var(--danger);
			font-size: typography.$font-small;
			animation: fadeIn effects.$duration-opacity-fade ease-in;
		}
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	// Import menu styles
	:global(.dropdown-menu) {
		background: var(--app-bg, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: layout.$card-corner;
		box-shadow: var(--shadow-md);
		padding: spacing.$unit-half;
		min-width: calc(spacing.$unit * 22.5);
		z-index: effects.$z-modal;
	}

	:global(.dropdown-menu-item) {
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner-small;
		cursor: pointer;
		font-size: typography.$font-regular;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: spacing.$unit;

		&:hover {
			background: var(--button-contained-bg-hover, #f5f5f5);
		}
	}

	:global(.dropdown-menu-separator) {
		height: 1px;
		background: var(--menu-separator, #e5e5e5);
		margin: spacing.$unit-half 0;
	}
</style>
