<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import InfoTile from './InfoTile.svelte'
	import VideoDialog from './VideoDialog.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import expandIcon from '$src/assets/icons/expand.svg?raw'

	interface Props {
		videoUrl?: string
		videoDuration?: string
		canEdit?: boolean
		onAdd?: () => void
	}

	let { videoUrl, videoDuration, canEdit = false, onAdd }: Props = $props()

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
		<button type="button" class="video-container" onclick={openDialog}>
			{#if thumbnailUrl}
				<div class="thumbnail-container">
					<img src={thumbnailUrl} alt={videoTitle ?? 'Video thumbnail'} class="thumbnail" />
					<div class="play-badge">
						<Icon name="play" size={10} />
						{#if videoDuration}
							<span class="duration">{videoDuration}</span>
						{/if}
					</div>
				</div>
			{/if}
			{#if videoTitle}
				<p class="video-title">{videoTitle}</p>
			{/if}
		</button>

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

	.video-container {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: $unit;
		margin: 0 (-$unit) (-$unit) (-$unit);
		padding: $unit;
		border-radius: $item-corner;
		background: none;
		border: none;
		cursor: pointer;
		color: inherit;
		font: inherit;
		text-align: left;
		width: calc(100% + #{$unit * 2});
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--button-bg);
		}
	}

	.thumbnail-container {
		position: relative;
		height: 60px;
		aspect-ratio: 16 / 9;
		border-radius: $item-corner;
		overflow: hidden;
		flex-shrink: 0;
	}

	.thumbnail {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.play-badge {
		position: absolute;
		bottom: $unit-half;
		left: $unit-half;
		display: flex;
		align-items: center;
		gap: $unit-half;
		padding: 2px $unit-half;
		border-radius: $item-corner;
		background: rgba(0, 0, 0, 0.7);
		color: white;
	}

	.duration {
		font-size: $font-tiny;
		font-weight: $bold;
		font-variant-numeric: tabular-nums;
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
