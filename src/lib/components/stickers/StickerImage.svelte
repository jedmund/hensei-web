<script lang="ts">
	/**
	 * One sticker: its image with its meaning (in the user's language) as the
	 * tooltip. Meanings come from the editor-managed catalogue, not Paraglide,
	 * and are rendered as text.
	 */
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { getHostedImageUrl } from '$lib/utils/images'
	import type { Sticker } from '$lib/types/api/sticker'

	interface Props {
		sticker?: Sticker | undefined
		/** Shown as the tooltip when the sticker isn't in the catalogue */
		slug?: string
		size?: number
		/** The viewer's own sticker */
		highlighted?: boolean
		/** Skip the tooltip, e.g. when the meaning is shown next to the image */
		plain?: boolean
	}

	let { sticker, slug = '', size = 24, highlighted = false, plain = false }: Props = $props()

	const meaning = $derived(sticker ? localizedName(sticker.meaning) : slug)
	const src = $derived(getHostedImageUrl(sticker?.imageUrl))
</script>

{#snippet image()}
	<span class="sticker" class:highlighted style:--sticker-size="{size}px">
		{#if src}
			<img {src} alt={meaning} width={size} height={size} loading="lazy" />
		{:else}
			<span class="fallback" aria-label={meaning}><Icon name="sticker" size={size * 0.7} /></span>
		{/if}
	</span>
{/snippet}

{#if plain}
	{@render image()}
{:else}
	<Tooltip content={meaning}>
		{@render image()}
	</Tooltip>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.sticker {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--sticker-size);
		height: var(--sticker-size);
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;

		&.highlighted {
			box-shadow: 0 0 0 1px var(--accent-yellow);
			border-radius: 50%;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}

	.fallback {
		display: inline-flex;
		color: var(--text-tertiary);
	}
</style>
