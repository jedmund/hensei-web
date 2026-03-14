<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';
	import * as m from '$lib/paraglide/messages';

	const { editor }: NodeViewProps = $props();
	import Audio from '@lucide/svelte/icons/audio-lines';

	function handleClick() {
		const audioUrl = prompt(m.editor_prompt_audio_url());
		if (audioUrl) {
			editor.chain().focus().setAudio(audioUrl).run();
		}
	}
</script>

<MediaPlaceHolder
	class="edra-media-placeholder-wrapper"
	icon={Audio}
	title={m.editor_insert_audio()}
	onClick={handleClick}
/>
