<script lang="ts">
	// A sticker's English and Japanese images, side by side
	import * as m from '$lib/paraglide/messages'
	import type { Sticker } from '$lib/types/api/sticker'
	import { getHostedImageUrl } from '$lib/utils/images/core'

	let { record }: { record: Sticker } = $props()

	const images = $derived([
		{ label: m.db_stickers_image_en(), url: record.imageUrl, empty: m.db_stickers_image_none() },
		{
			label: m.db_stickers_image_ja(),
			url: record.imageUrlJa,
			empty: m.db_stickers_image_ja_none()
		}
	])
</script>

<div class="images">
	{#each images as image (image.label)}
		<figure>
			{#if image.url}
				<img src={getHostedImageUrl(image.url)} alt={image.label} width="64" height="64" />
			{:else}
				<span class="empty">{image.empty}</span>
			{/if}
			<figcaption>{image.label}</figcaption>
		</figure>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.images {
		display: flex;
		gap: spacing.$unit-2x;
	}

	figure {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit-half;
		margin: 0;
	}

	img {
		width: 64px;
		height: 64px;
		object-fit: contain;
	}

	.empty {
		display: flex;
		align-items: center;
		min-height: 64px;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	figcaption {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
