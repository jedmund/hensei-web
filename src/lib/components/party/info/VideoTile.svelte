<script lang="ts">
	import InfoTile from './InfoTile.svelte'

	interface Props {
		videoUrl?: string
	}

	let { videoUrl }: Props = $props()

	// State for video playback
	let isPlaying = $state(false)
	let videoTitle = $state<string | null>(null)

	function extractYoutubeId(url: string): string | null {
		const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
		return match?.[1] ?? null
	}

	const videoId = $derived(videoUrl ? extractYoutubeId(videoUrl) : null)
	const thumbnailUrl = $derived(
		videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
	)
	const embedUrl = $derived(
		videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : null
	)

	// Fetch video title when videoId changes
	$effect(() => {
		const id = videoId
		if (!id) {
			videoTitle = null
			return
		}

		const controller = new AbortController()

		fetch(
			`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`,
			{ signal: controller.signal }
		)
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

	// Reset playing state when videoUrl changes
	$effect(() => {
		videoUrl
		isPlaying = false
	})

	function handlePlay() {
		isPlaying = true
	}
</script>

<InfoTile label="Video" class="video-tile">
	{#if videoUrl && videoId}
		<div class="video-container">
			{#if isPlaying && embedUrl}
				<div class="embed-container">
					<iframe
						src={embedUrl}
						title={videoTitle ?? 'YouTube video'}
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{:else if thumbnailUrl}
				<button type="button" class="thumbnail-button" onclick={handlePlay}>
					<div class="thumbnail-container">
						<img src={thumbnailUrl} alt={videoTitle ?? 'Video thumbnail'} class="thumbnail" />
						<div class="play-overlay">
							<svg viewBox="0 0 68 48" class="play-icon">
								<path
									d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
									fill="#f00"
								/>
								<path d="M45 24L27 14v20" fill="#fff" />
							</svg>
						</div>
					</div>
				</button>
			{/if}
			{#if videoTitle}
				<p class="video-title">{videoTitle}</p>
			{/if}
		</div>
	{:else}
		<span class="empty-state">No video</span>
	{/if}
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

	.video-container {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.thumbnail-button {
		display: block;
		width: 100%;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;
	}

	.thumbnail-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: $card-corner;
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

		.play-icon {
			width: 68px;
			height: 48px;
			opacity: 0.9;
			@include smooth-transition($duration-quick, opacity, transform);
		}
	}

	.thumbnail-button:hover .play-overlay {
		background: rgba(0, 0, 0, 0.2);

		.play-icon {
			opacity: 1;
			transform: scale(1.1);
		}
	}

	.embed-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: $card-corner;
		overflow: hidden;

		iframe {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
		}
	}

	.video-title {
		margin: 0;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		line-height: 1.3;

		// Truncate to 2 lines
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
