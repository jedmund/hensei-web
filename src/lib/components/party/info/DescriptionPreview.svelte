<script lang="ts">
	/**
	 * A party description's first line, up to three lines, with "Read more"
	 * when there's more (or it's cut off). Clicking opens the description;
	 * with none yet, those who can edit are asked to write one.
	 */
	import * as m from '$lib/paraglide/messages'
	import { descriptionPreview } from '$lib/utils/descriptionPreview'

	interface Props {
		description?: string | undefined
		canEdit?: boolean
		/** Colors "Read more" (the creator's element) */
		element?: string | null | undefined
		onOpen: () => void
		/** Clicked instead of onOpen when there's no description to read */
		onEdit?: (() => void) | undefined
	}

	let { description, canEdit = false, element, onOpen, onEdit }: Props = $props()

	const preview = $derived(descriptionPreview(description))

	// "Read more" also when the text overflows its three lines
	let contentEl = $state<HTMLDivElement | undefined>(undefined)
	let needsReadMore = $state(false)

	$effect(() => {
		if (contentEl) {
			needsReadMore = contentEl.scrollHeight > contentEl.clientHeight
		}
	})
</script>

<button
	type="button"
	class="description-content"
	onclick={canEdit && !preview.text && onEdit ? onEdit : onOpen}
>
	{#if preview.text}
		<div class="preview-text" bind:this={contentEl}>
			<p>
				{preview.text}{#if preview.hasMore || needsReadMore}…&nbsp;<span
						class="read-more"
						style:color={element ? `var(--${element}-ghost-text)` : undefined}
						>{m.description_read_more()}</span
					>{/if}
			</p>
		</div>
	{:else}
		<span class="empty-state"
			>{canEdit ? m.party_write_description() : m.party_no_description()}</span
		>
	{/if}
</button>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

	.description-content {
		padding: $unit;
		margin: 0 (-$unit);
		background: transparent;
		border: none;
		border-radius: $item-corner;
		justify-content: flex-start;
		align-items: flex-start;
		display: flex;
		cursor: pointer;
		text-align: left;
		color: inherit;
		font: inherit;
		min-width: 0;
		width: calc(100% + #{$unit * 2});
		flex: 1;
		overflow: hidden;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--button-bg);
		}
	}

	.preview-text {
		font-size: $font-regular;
		color: var(--text-secondary);
		overflow: hidden;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;

		p {
			margin: 0;
			display: inline;
		}
	}

	.read-more {
		color: var(--text-tertiary);
		font-weight: $medium;
	}

	.empty-state {
		flex: 1;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}
</style>
