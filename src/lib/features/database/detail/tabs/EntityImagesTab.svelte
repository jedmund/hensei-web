
<script lang="ts">
	import { ContextMenu } from 'bits-ui'
	import ContextMenuWrapper from '$lib/components/ui/menu/ContextMenuWrapper.svelte'

	export interface ImageItem {
		url: string
		label: string
		variant: string
		pose?: string
		poseLabel?: string // Custom label for the pose group (e.g., "ULB" for summons)
		placeholder?: boolean
	}

	interface Props {
		images: ImageItem[]
		canEdit?: boolean
		onDownloadImage?: (
			size: string,
			transformation: string | undefined,
			force: boolean
		) => Promise<void>
		onDownloadAllPose?: (pose: string, force: boolean) => Promise<void>
		onDownloadAllImages?: (force: boolean) => Promise<void>
	}

	let {
		images,
		canEdit = false,
		onDownloadImage,
		onDownloadAllPose,
		onDownloadAllImages
	}: Props = $props()

	// Track download status per image
	let downloadingImages = $state<Set<string>>(new Set())
	let downloadingAll = $state(false)

	// Cache-buster: increment to force image reload after downloads
	let cacheBuster = $state(0)

	// Group images by pose for better layout
	const imagesByPose = $derived.by(() => {
		const groups = new Map<string, ImageItem[]>()
		for (const image of images) {
			const key = image.pose ?? 'default'
			if (!groups.has(key)) {
				groups.set(key, [])
			}
			groups.get(key)!.push(image)
		}
		return groups
	})

	// Get pose labels in order
	// Characters: 01=Base, 02=MLB, 03=FLB, 04=Transcendence
	// Summons: 01=Base, 02=ULB, 03=Transcendence
	// Weapons: 01=Base, 02=Transcendence
	const poseOrder = ['01', '02', '03', '04', '01_style', 'default']
	const poseLabels: Record<string, string> = {
		'01': 'Base',
		'02': 'MLB', // Will be overridden by label from page for summons/weapons
		'03': 'FLB',
		'04': 'Transcendence',
		default: ''
	}

	const sortedPoses = $derived(
		Array.from(imagesByPose.keys()).sort(
			(a, b) => poseOrder.indexOf(a) - poseOrder.indexOf(b)
		)
	)

	// Get the pose label from the first image in each group, or fall back to default
	function getPoseLabel(pose: string, poseImages: ImageItem[]): string {
		const customLabel = poseImages[0]?.poseLabel
		if (customLabel) return customLabel
		return poseLabels[pose] || pose
	}

	// Create a unique key for an image (for tracking download state)
	function getImageKey(image: ImageItem): string {
		return `${image.pose ?? 'default'}-${image.variant}`
	}

	// Append cache-buster to image URL to force reload after download
	function bustUrl(url: string): string {
		if (!url || cacheBuster === 0) return url
		const sep = url.includes('?') ? '&' : '?'
		return `${url}${sep}v=${cacheBuster}`
	}

	// Handle single image download
	async function handleDownload(image: ImageItem, force: boolean) {
		if (!onDownloadImage) return

		const key = getImageKey(image)
		downloadingImages.add(key)
		downloadingImages = new Set(downloadingImages)

		try {
			await onDownloadImage(image.variant, image.pose, force)
			cacheBuster++
		} finally {
			downloadingImages.delete(key)
			downloadingImages = new Set(downloadingImages)
		}
	}

	// Handle download all images for a pose
	async function handleDownloadAllPose(pose: string, force: boolean) {
		if (!onDownloadAllPose) return

		// Mark all images in this pose as downloading
		const poseImages = imagesByPose.get(pose) ?? []
		for (const img of poseImages) {
			downloadingImages.add(getImageKey(img))
		}
		downloadingImages = new Set(downloadingImages)

		try {
			await onDownloadAllPose(pose, force)
			cacheBuster++
		} finally {
			for (const img of poseImages) {
				downloadingImages.delete(getImageKey(img))
			}
			downloadingImages = new Set(downloadingImages)
		}
	}

	// Handle download all images across all poses/elements
	async function handleDownloadAll(force: boolean) {
		if (!onDownloadAllImages) return

		downloadingAll = true
		// Mark every image as downloading
		for (const image of images) {
			downloadingImages.add(getImageKey(image))
		}
		downloadingImages = new Set(downloadingImages)

		try {
			await onDownloadAllImages(force)
			cacheBuster++
		} finally {
			downloadingAll = false
			downloadingImages.clear()
			downloadingImages = new Set(downloadingImages)
		}
	}
</script>

<div class="images-tab">
	{#each sortedPoses as pose}
		{@const poseImages = imagesByPose.get(pose) ?? []}
		{@const poseLabel = getPoseLabel(pose, poseImages)}
		{@const showHeader = poseLabel && sortedPoses.length > 1}

		{#if showHeader}
			<h3 class="pose-header">{poseLabel}</h3>
		{/if}

		<div class="images-grid">
			{#each poseImages as image}
				{@const imageKey = getImageKey(image)}
				{@const isDownloading = downloadingImages.has(imageKey)}

				{#if image.placeholder}
					<div class="image-item placeholder">
						<div class="image-container empty"></div>
						<span class="image-label">{image.variant}</span>
					</div>
				{:else if canEdit && onDownloadImage}
					<ContextMenuWrapper>
						{#snippet trigger()}
							<div class="image-item" class:downloading={isDownloading}>
								<a
									href={bustUrl(image.url)}
									target="_blank"
									rel="noopener noreferrer"
									class="image-container"
								>
									<img src={bustUrl(image.url)} alt={image.label} loading="lazy" />
									{#if isDownloading}
										<div class="download-overlay">
											<span class="download-spinner"></span>
										</div>
									{/if}
								</a>
								<span class="image-label">{image.variant}</span>
							</div>
						{/snippet}

						{#snippet menu()}
							<ContextMenu.Item
								class="context-menu-item"
								onclick={() => handleDownload(image, false)}
								disabled={isDownloading}
							>
								Download Image
							</ContextMenu.Item>
							<ContextMenu.Item
								class="context-menu-item"
								onclick={() => handleDownload(image, true)}
								disabled={isDownloading}
							>
								Re-download Image
							</ContextMenu.Item>
							{#if onDownloadAllPose}
								<ContextMenu.Separator class="context-menu-separator" />
								<ContextMenu.Item
									class="context-menu-item"
									onclick={() => handleDownloadAllPose(pose, false)}
								>
									Download All {poseLabel} Images
								</ContextMenu.Item>
							{/if}
							{#if onDownloadAllImages}
								<ContextMenu.Item
									class="context-menu-item"
									onclick={() => handleDownloadAll(false)}
									disabled={downloadingAll}
								>
									Download All Images
								</ContextMenu.Item>
							{/if}
							<ContextMenu.Separator class="context-menu-separator" />
							<ContextMenu.Item
								class="context-menu-item"
								onclick={() => window.open(bustUrl(image.url), '_blank')}
							>
								Open in New Tab
							</ContextMenu.Item>
						{/snippet}
					</ContextMenuWrapper>
				{:else}
					<div class="image-item">
						<a
							href={bustUrl(image.url)}
							target="_blank"
							rel="noopener noreferrer"
							class="image-container"
						>
							<img src={bustUrl(image.url)} alt={image.label} loading="lazy" />
						</a>
						<span class="image-label">{image.variant}</span>
					</div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.images-tab {
		padding: spacing.$unit-2x;
	}

	.pose-header {
		font-size: typography.$font-regular;
		font-weight: typography.$bold;
		color: var(--text-primary);
		margin: 0 0 spacing.$unit 0;
		padding-top: spacing.$unit-2x;

		&:first-child {
			padding-top: 0;
		}
	}

	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: spacing.$unit-2x;
		margin-bottom: spacing.$unit-2x;
	}

	.image-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;

		&.downloading {
			opacity: 0.7;
		}
	}

	.image-container {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		aspect-ratio: 1;
		background: var(--background);
		border-radius: layout.$item-corner;
		overflow: hidden;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.02);
		}

		&.empty {
			opacity: 0.3;

			&:hover {
				transform: none;
			}
		}

		img {
			display: block;
			max-width: 100%;
			max-height: 100%;
			width: auto;
			height: auto;
			object-fit: contain;
		}
	}

	.download-overlay {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.download-spinner {
		width: 24px;
		height: 24px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.image-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		text-align: center;
		text-transform: capitalize;
	}
</style>
