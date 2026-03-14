<script lang="ts">
	import { Editor } from '@tiptap/core';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		editor: Editor;
	}

	const { editor }: Props = $props();

	const FONT_SIZE = [
		{ label: m.font_size_tiny(), value: '0.7rem' },
		{ label: m.font_size_smaller(), value: '0.75rem' },
		{ label: m.font_size_small(), value: '0.9rem' },
		{ label: m.font_size_default(), value: '' },
		{ label: m.font_size_large(), value: '1.25rem' },
		{ label: m.font_size_extra_large(), value: '1.5rem' }
	];

	let currentSize = $derived.by(() => editor.getAttributes('textStyle').fontSize || '');
</script>

<select
	value={currentSize}
	onchange={(e) => {
		editor
			.chain()
			.focus()
			.setFontSize((e.target as HTMLSelectElement).value)
			.run();
	}}
	title="Font Size"
>
	{#each FONT_SIZE as fontSize (fontSize)}
		<option value={fontSize.value} label={fontSize.label.split(' ')[0]}></option>
	{/each}
</select>

<style>
	select {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		background-color: var(--edra-button-bg-color);
		border-radius: var(--edra-button-border-radius);
		cursor: pointer;
		transition: background-color 0.2s ease-in-out;
		padding: var(--edra-button-padding);
		min-width: fit;
		min-height: full;
	}
</style>
