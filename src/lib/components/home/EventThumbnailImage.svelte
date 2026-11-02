<script lang="ts">
	/**
	 * An event's thumbnail art, or its name when there is none or the image
	 * fails to load. Fills its container; the container sets the size, shape
	 * and background. Get the URL from `eventThumbnailUrl`.
	 */
	interface Props {
		imageUrl: string | null
		/** Tried when `imageUrl` fails, e.g. the English banner behind a Japanese one */
		fallbackUrl?: string | null
		label: string
	}

	let { imageUrl, fallbackUrl = null, label }: Props = $props()

	let failed = $state<string[]>([])
	const shown = $derived(
		[imageUrl, fallbackUrl].find((url) => url && !failed.includes(url)) ?? null
	)
</script>

{#if shown}
	<img src={shown} alt="" loading="lazy" onerror={() => (failed = [...failed, shown])} />
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
