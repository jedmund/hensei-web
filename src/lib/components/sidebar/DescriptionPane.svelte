<script lang="ts">
	import { onMount } from 'svelte'
	import DescriptionRenderer from '$lib/components/DescriptionRenderer.svelte'
	import EditDescriptionPane from './EditDescriptionPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { usePaneStack } from '$lib/stores/paneStack.svelte'

	interface Props {
		description?: string
		videoUrl?: string
		canEdit?: boolean
		partyId?: string
		partyShortcode?: string
		onSave?: (description: string) => Promise<void>
	}

	let { description, videoUrl, canEdit = false, partyId, partyShortcode, onSave }: Props = $props()

	/** Extract YouTube video ID from various URL formats */
	function extractVideoId(url?: string): string | null {
		if (!url) return null
		// Match youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
		const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
		return match?.[1] ?? null
	}

	const videoId = $derived(extractVideoId(videoUrl))

	const paneStack = usePaneStack()

	function openEditPane() {
		paneStack.push({
			id: 'edit-description',
			title: 'Edit Description',
			component: EditDescriptionPane,
			props: {
				description,
				onSave: async (content: string) => {
					if (onSave) {
						await onSave(content)
					}
					paneStack.pop()
				}
			},
			scrollable: false
		})
	}

	// Set up Edit button in sidebar header when canEdit is true
	onMount(() => {
		if (canEdit) {
			sidebar.setAction(openEditPane, 'Edit')
		}
	})
</script>

<div class="description-pane">
	<div class="content-section">
		<div class="content-inner">
			{#if videoId}
				<div class="video-embed">
					<iframe
						src="https://www.youtube.com/embed/{videoId}"
						title="YouTube video"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowfullscreen
					></iframe>
				</div>
			{/if}
			{#if description}
				<div class="description-content">
					<DescriptionRenderer content={description} truncate={false} />
				</div>
			{:else}
				<div class="empty-state">
					<p>No description available for this party.</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/effects' as *;

	.description-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		color: var(--text-primary);
	}

	.video-embed {
		margin-bottom: $unit-2x;
		border-radius: $unit;
		overflow: hidden;

		iframe {
			width: 100%;
			aspect-ratio: 16 / 9;
			display: block;
		}
	}

	.content-section {
		flex: 1;
		overflow-y: auto;

		// Custom scrollbar styling - on the outer container
		&::-webkit-scrollbar {
			width: 6px;
		}

		&::-webkit-scrollbar-track {
			background: var(--button-bg);
			border-radius: 3px;
		}

		&::-webkit-scrollbar-thumb {
			background: var(--text-secondary);
			border-radius: 3px;

			&:hover {
				background: var(--text-primary);
			}
		}
	}

	.content-inner {
		padding: 0 $unit-2x;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: $unit-4x;
		min-height: 200px;

		p {
			margin: 0;
			color: var(--text-secondary);
			font-size: $font-regular;
		}
	}
</style>
