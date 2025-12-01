<svelte:options runes={true} />

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import type { CharacterDownloadStatus } from '$lib/api/adapters/entity.adapter'

	interface Props {
		characterId: string
		granblueId: string
		canEdit?: boolean
	}

	let { characterId, granblueId, canEdit = false }: Props = $props()

	let isDownloading = $state(false)
	let downloadStatus = $state<CharacterDownloadStatus | null>(null)
	let downloadError = $state<string | null>(null)
	let pollingInterval = $state<ReturnType<typeof setInterval> | null>(null)

	const isComplete = $derived(downloadStatus?.status === 'completed')
	const isFailed = $derived(downloadStatus?.status === 'failed')
	const isInProgress = $derived(
		downloadStatus?.status === 'queued' || downloadStatus?.status === 'processing'
	)

	async function startDownload(force = false) {
		isDownloading = true
		downloadError = null

		try {
			await entityAdapter.downloadCharacterImages(characterId, { force })
			// Start polling for status
			startPolling()
		} catch (error) {
			downloadError = 'Failed to start download'
			console.error('Download error:', error)
			isDownloading = false
		}
	}

	function startPolling() {
		// Clear any existing polling
		if (pollingInterval) {
			clearInterval(pollingInterval)
		}

		// Poll every 2 seconds
		pollingInterval = setInterval(async () => {
			try {
				const status = await entityAdapter.getCharacterDownloadStatus(characterId)
				downloadStatus = status

				// Stop polling if completed or failed
				if (status.status === 'completed' || status.status === 'failed') {
					stopPolling()
					isDownloading = false
				}
			} catch (error) {
				console.error('Status polling error:', error)
				stopPolling()
				isDownloading = false
				downloadError = 'Failed to get download status'
			}
		}, 2000)

		// Initial status check
		entityAdapter.getCharacterDownloadStatus(characterId).then((status) => {
			downloadStatus = status
		})
	}

	function stopPolling() {
		if (pollingInterval) {
			clearInterval(pollingInterval)
			pollingInterval = null
		}
	}

	// Cleanup on unmount
	$effect(() => {
		return () => {
			stopPolling()
		}
	})
</script>

{#if canEdit}
	<DetailsContainer title="Image Management">
		<div class="images-section">
			<p class="description">Download character images from the game server to your storage.</p>

			<div class="actions">
				<Button
					variant="primary"
					size="small"
					onclick={() => startDownload(false)}
					disabled={isDownloading || isInProgress}
				>
					{isDownloading || isInProgress ? 'Downloading...' : 'Download Images'}
				</Button>

				{#if isComplete}
					<Button
						variant="secondary"
						size="small"
						onclick={() => startDownload(true)}
						disabled={isDownloading}
					>
						Re-download (force)
					</Button>
				{/if}
			</div>

			{#if downloadStatus}
				<div class="status" class:success={isComplete} class:error={isFailed}>
					{#if isInProgress}
						<div class="progress-bar">
							<div class="progress-fill" style="width: {downloadStatus.progress ?? 0}%"></div>
						</div>
						<span class="progress-text">
							{downloadStatus.progress ?? 0}% - {downloadStatus.imagesDownloaded ??
								0}/{downloadStatus.imagesTotal ?? '?'} images
						</span>
					{:else if isComplete}
						<span>Download complete - {downloadStatus.imagesDownloaded} images downloaded</span>
					{:else if isFailed}
						<span>Download failed: {downloadStatus.error}</span>
					{/if}
				</div>
			{/if}

			{#if downloadError}
				<div class="error-message">{downloadError}</div>
			{/if}
		</div>
	</DetailsContainer>
{/if}

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.images-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x 0;
	}

	.description {
		color: colors.$grey-50;
		font-size: typography.$font-small;
		margin: 0;
	}

	.actions {
		display: flex;
		gap: spacing.$unit;
	}

	.status {
		padding: spacing.$unit;
		border-radius: 4px;
		font-size: typography.$font-small;

		&.success {
			background: colors.$wind-bg-20;
			color: colors.$wind-text-20;
		}

		&.error {
			background: colors.$error--bg--light;
			color: colors.$error;
		}
	}

	.progress-bar {
		height: 4px;
		background: colors.$grey-80;
		border-radius: 2px;
		overflow: hidden;
		margin-bottom: spacing.$unit;
	}

	.progress-fill {
		height: 100%;
		background: colors.$accent--blue--light;
		transition: width 0.3s ease;
	}

	.progress-text {
		color: colors.$grey-50;
	}

	.error-message {
		color: colors.$error;
		font-size: typography.$font-small;
		padding: spacing.$unit;
		background: colors.$error--bg--light;
		border-radius: 4px;
	}
</style>
