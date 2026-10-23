<script lang="ts">
	/**
	 * Generic database-entity icon (role, difficulty tier, etc.). Resolves a
	 * CDN URL from `iconKey`, with `src` taking precedence for upload previews.
	 * Always renders as a circle with the standard placeholder background.
	 */
	import { buildEntityIconUrl } from '$lib/utils/entityIcon'

	interface Props {
		iconKey?: string | null | undefined
		/** Direct image URL override; takes precedence over iconKey (used for upload previews) */
		src?: string | null | undefined
		name?: string
		/** Outer container size in px */
		size?: number
		/** Image size in px; defaults to the container size (image fills) */
		imageSize?: number
	}

	let { iconKey, src, name = '', size = 32, imageSize }: Props = $props()

	const url = $derived(src ?? buildEntityIconUrl(iconKey))
	const containerStyle = $derived(`width: ${size}px; height: ${size}px;`)
	const imgSizePx = $derived(imageSize ?? size)
	const imageStyle = $derived(`width: ${imgSizePx}px; height: ${imgSizePx}px;`)
</script>

<span class="entity-icon" style={containerStyle} aria-hidden={!name}>
	{#if url}
		<img src={url} alt={name} style={imageStyle} />
	{/if}
</span>

<style lang="scss">
	.entity-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--placeholder-bg);
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;

		img {
			object-fit: contain;
		}
	}
</style>
