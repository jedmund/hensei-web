<script lang="ts">
	import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
	import type { NodeViewProps } from '@tiptap/core';
	import * as m from '$lib/paraglide/messages';

	const { editor }: NodeViewProps = $props();
	import Video from '@lucide/svelte/icons/video';

	function handleClick() {
		const videoUrl = prompt(m.editor_prompt_video_url());
		if (videoUrl) {
			editor.chain().focus().setVideo(videoUrl).run();
		}
	}
</script>

<MediaPlaceHolder
	class="edra-media-placeholder-wrapper"
	icon={Video}
	title={m.editor_insert_video()}
	onClick={handleClick}
/>
