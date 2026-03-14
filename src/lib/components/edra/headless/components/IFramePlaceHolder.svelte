<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';
	import * as m from '$lib/paraglide/messages';

	const { editor }: NodeViewProps = $props();
	import Audio from '@lucide/svelte/icons/code-xml';

	function handleClick() {
		const iframUrl = prompt(m.editor_prompt_iframe_url());
		if (iframUrl) {
			editor.chain().focus().setIframe({ src: iframUrl }).run();
		}
	}
</script>

<MediaPlaceHolder
	class="edra-media-placeholder-wrapper"
	icon={Audio}
	title={m.editor_insert_iframe()}
	onClick={handleClick}
/>
