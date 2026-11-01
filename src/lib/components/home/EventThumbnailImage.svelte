<script lang="ts">
	/**
	 * An event's thumbnail art, or its name when there is none or the image
	 * fails to load. Fills its container; the container sets the size, shape
	 * and background. Get the URL from `eventThumbnailUrl`.
	 */
	interface Props {
		imageUrl: string | null
		label: string
	}

	let { imageUrl, label }: Props = $props()

	let failedUrl = $state<string | null>(null)
</script>

{#if imageUrl && failedUrl !== imageUrl}
	<img src={imageUrl} alt="" loading="lazy" onerror={() => (failedUrl = imageUrl)} />
{:else}
	<span class="name">{label}</span>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.name {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: $unit-half;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
		line-height: 1.2;
		text-align: center;
	}
</style>
