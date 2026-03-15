<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Dialog from '$lib/components/ui/Dialog.svelte'

	interface Props {
		open: boolean
		videoId: string
		videoTitle?: string | null
	}

	let { open = $bindable(false), videoId, videoTitle }: Props = $props()

	const embedUrl = $derived(`https://www.youtube.com/embed/${videoId}?autoplay=1`)
</script>

<Dialog bind:open size="medium">
	<div class="video-dialog">
		<div class="embed-container">
			<iframe
				src={embedUrl}
				title={videoTitle ?? m.tooltip_youtube_video()}
				frameborder="0"
				allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				allowfullscreen
			></iframe>
		</div>
		{#if videoTitle}
			<p class="video-title">{videoTitle}</p>
		{/if}
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	:global(.dialog-overlay) {
		background: rgba(0, 0, 0, 0.8) !important;
	}

	:global(.dialog-content) {
		border-radius: $page-corner !important;
	}

	:global(.dialog-close:hover) {
		background: var(--dialog-bg) !important;
	}

	.video-dialog {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		padding: $unit $unit $unit-2x $unit;
	}

	.embed-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		border-radius: $item-corner;
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
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
	}
</style>
