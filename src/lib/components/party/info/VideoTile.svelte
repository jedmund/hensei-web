<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import InfoTile from './InfoTile.svelte'
	import VideoDialog from './VideoDialog.svelte'
	import YouTubePlayIcon from './YouTubePlayIcon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import expandIcon from '$src/assets/icons/expand.svg?raw'

	interface Props {
		videoUrl?: string
		canEdit?: boolean
		onAdd?: () => void
	}

	let { videoUrl, canEdit = false, onAdd }: Props = $props()

	let dialogOpen = $state(false)

	let videoTitle = $state<string | null>(null)

	function extractYoutubeId(url: string): string | null {
		const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
		return match?.[1] ?? null
	}

	const videoId = $derived(videoUrl ? extractYoutubeId(videoUrl) : null)
	const thumbnailUrl = $derived(
		videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
	)
	const isEmpty = $derived(!videoUrl)
	const showAdd = $derived(canEdit && isEmpty)

	// Fetch video title when videoId changes
	$effect(() => {
		const id = videoId
		if (!id) {
			videoTitle = null
			return
		}

		const controller = new AbortController()

		fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`, {
			signal: controller.signal
		})
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (data?.title) {
					videoTitle = data.title
				}
			})
			.catch(() => {
				// Ignore fetch errors
			})

		return () => controller.abort()
	})

	function openDialog(e: MouseEvent) {
		e.stopPropagation()
		dialogOpen = true
	}
</script>

<InfoTile label={m.party_video()} class="video-tile {!isEmpty ? 'has-video' : ''}" {showAdd} {onAdd} clickable={showAdd} onclick={showAdd ? onAdd : undefined}>
	{#snippet headerAction()}
		{#if videoUrl && videoId}
			<Tooltip content={m.tooltip_expand_video()}>
				<Button variant="ghost" size="small" iconOnly onclick={openDialog}>
					<span class="expand-icon">{@html expandIcon}</span>
				</Button>
			</Tooltip>
		{/if}
	{/snippet}
	{#if videoUrl && videoId}
		<div class="video-container">
			{#if thumbnailUrl}
				<button type="button" class="thumbnail-button" onclick={openDialog}>
					<div class="thumbnail-container">
						<img src={thumbnailUrl} alt={videoTitle ?? 'Video thumbnail'} class="thumbnail" />
						<div class="play-overlay">
							<YouTubePlayIcon class="play-icon" />
						</div>
					</div>
				</button>
			{/if}
			{#if videoTitle}
				<p class="video-title">{videoTitle}</p>
			{/if}
		</div>

		<VideoDialog bind:open={dialogOpen} {videoId} {videoTitle} />
	{:else}
		<span class="empty-state">{canEdit ? m.party_add_video() : m.party_no_video()}</span>
	{/if}
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

	:global(.video-tile.has-video) {
		padding-right: $unit !important;
	}

	.video-container {
		display: flex;
		flex-direction: row;
		gap: $unit;
	}

	.thumbnail-button {
		display: block;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
		flex-shrink: 0;
	}

	.thumbnail-container {
		position: relative;
		width: 176px;
		height: 99px;
		border-radius: $item-corner;
		overflow: hidden;
	}

	.thumbnail {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.play-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.1);
		@include smooth-transition($duration-quick, background);

		:global(.play-icon) {
			width: 68px;
			height: 48px;
			opacity: 0.9;
			@include smooth-transition($duration-quick, opacity, transform);
		}
	}

	.thumbnail-button:hover .play-overlay {
		background: rgba(0, 0, 0, 0.2);

		:global(.play-icon) {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	.video-title {
		margin: 0;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		line-height: 1.3;
		align-self: center;
	}

	.expand-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--icon-secondary);
	}

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
	}
</style>
