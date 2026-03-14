<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';
	import * as m from '$lib/paraglide/messages';

	const { editor }: NodeViewProps = $props();
	import Image from '@lucide/svelte/icons/image';

	function handleClick() {
		const imageUrl = prompt(m.editor_prompt_image_url());
		if (imageUrl) {
			editor.chain().focus().setImage({ src: imageUrl }).run();
		}
	}
</script>

<MediaPlaceHolder
	class="edra-media-placeholder-wrapper"
	icon={Image}
	title={m.editor_insert_image()}
	onClick={handleClick}
/>
