<script lang="ts">
	// A sticker list row's image, in the viewer's language
	import StickerImage from '$lib/components/stickers/StickerImage.svelte'
	import type { AdminStickerRow } from '$lib/types/api/admin'

	const { row }: { row: AdminStickerRow } = $props()

	const sticker = $derived({
		...row,
		meaning: { en: row.meaningEn, ja: row.meaningJp ?? '' }
	})
</script>

<div class="thumbnail">
	<StickerImage {sticker} size={40} />
</div>

<style lang="scss">
	.thumbnail {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
