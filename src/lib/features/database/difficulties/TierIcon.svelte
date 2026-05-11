<script lang="ts">
	import { getTierIconUrl } from '$lib/utils/difficulty'

	interface Props {
		imageKey?: string | null | undefined
		/** Direct image URL override; takes precedence over imageKey (used for upload previews) */
		src?: string | null | undefined
		/** Fallback color swatch when no image is present */
		color?: string | null | undefined
		name?: string
		/** Outer rounded-rect container size in px */
		size?: number
		/** Image size in px; defaults to the container size (image fills) */
		imageSize?: number
	}

	let { imageKey, src, color, name = '', size = 32, imageSize }: Props = $props()

	const url = $derived(src ?? getTierIconUrl(imageKey))
	const containerStyle = $derived(
		url
			? `width: ${size}px; height: ${size}px;`
			: `width: ${size}px; height: ${size}px; background: ${color || 'var(--placeholder-bg)'};`
	)
	const imgSizePx = $derived(imageSize ?? size)
	const imageStyle = $derived(`width: ${imgSizePx}px; height: ${imgSizePx}px;`)
</script>

<span class="tier-icon" style={containerStyle} aria-hidden={!name}>
	{#if url}
		<img src={url} alt={name} style={imageStyle} />
	{/if}
</span>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.tier-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		border: 1px solid var(--border-subtle);

		img {
			object-fit: contain;
		}
	}
</style>
