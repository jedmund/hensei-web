<script lang="ts">
	import type { Editor } from '@tiptap/core';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		editor: Editor;
	}
	const { editor }: Props = $props();

	const colors = [
		{ label: m.editor_color_default(), value: '' },
		{ label: m.editor_color_blue(), value: '#0000FF' },
		{ label: m.editor_color_brown(), value: '#A52A2A' },
		{ label: m.editor_color_green(), value: '#008000' },
		{ label: m.editor_color_grey(), value: '#808080' },
		{ label: m.editor_color_orange(), value: '#FFA500' },
		{ label: m.editor_color_pink(), value: '#FFC0CB' },
		{ label: m.editor_color_purple(), value: '#800080' },
		{ label: m.editor_color_red(), value: '#FF0000' },
		{ label: m.editor_color_yellow(), value: '#FFFF00' }
	];

	const currentColor = $derived.by(() => editor.getAttributes('textStyle').color ?? '');
	const currentHighlight = $derived.by(() => editor.getAttributes('highlight').color ?? '');
</script>

<select
	value={currentColor}
	onchange={(e) => {
		const color = (e.target as HTMLSelectElement).value;
		editor.chain().focus().setColor(color).run();
	}}
	style={`color: ${currentColor}`}
	title={m.editor_text_color()}
>
	<option value="" label="Default"></option>
	{#each colors as color (color)}
		<option value={color.value} label={color.label}></option>
	{/each}
</select>

<select
	value={currentHighlight}
	onchange={(e) => {
		const color = (e.target as HTMLSelectElement).value;
		editor.chain().focus().setHighlight({ color }).run();
	}}
	style={`background-color: ${currentHighlight}50`}
	title={m.editor_highlight_color()}
>
	<option value="" label="Default"></option>
	{#each colors as color (color)}
		<option value={color.value} label={color.label}>A</option>
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
		min-height: var(--edra-button-size);
	}
</style>
