<script lang="ts">
	/**
	 * Read-only Tiptap renderer for an item description. Mirrors the editor's
	 * formatting (bold, italic, underline, strike, lists, mentions) without any
	 * toolbar or edit affordances.
	 */
	import EdraEditor from '$lib/components/edra/headless/editor.svelte'
	import type { Description } from '$lib/types/api/party'
	import { descriptionToContent } from '$lib/utils/descriptionContent'
	import { untrack } from 'svelte'

	interface Props {
		value?: Description | null
	}

	let { value }: Props = $props()

	const initialContent = untrack(() => descriptionToContent(value))
</script>

{#if initialContent}
	<div class="description-view">
		<EdraEditor content={initialContent} editable={false} class="description-readonly" />
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.description-view {
		padding: 0 $unit;
		font-size: $font-regular;
		line-height: 1.5;
		color: var(--text-primary);
	}

	:global(.description-readonly .tiptap) {
		outline: none;
	}

	:global(.description-readonly .tiptap p) {
		margin: 0 0 0.5em;
	}

	:global(.description-readonly .tiptap p:last-child) {
		margin-bottom: 0;
	}

	:global(.description-readonly .tiptap ul),
	:global(.description-readonly .tiptap ol) {
		margin: 0 0 0.5em;
		padding-left: 1.25em;
	}
</style>
