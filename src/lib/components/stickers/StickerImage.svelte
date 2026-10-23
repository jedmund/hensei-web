<script lang="ts" module>
	/**
	 * Effects that make a stamp look like a physical sticker. They combine
	 * freely; small sizes (cards, menus) usually want none.
	 * - die-cut: a white border following the art's outline
	 * - shadow: a soft shadow under the sticker
	 * - tilt: a small fixed angle per sticker, so a row looks hand-placed
	 * - lift: rises and straightens on hover
	 * - foil: a holographic sheen across the art on hover
	 * Hover effects also play when a menu item wrapping the sticker is
	 * highlighted from the keyboard ([data-highlighted]).
	 */
	export type StickerEffect = 'die-cut' | 'shadow' | 'tilt' | 'lift' | 'foil'

	/** The effects each place a sticker is shown with */
	export const STICKER_EFFECTS = {
		/** The team page's sticker area */
		stage: ['die-cut', 'shadow', 'tilt', 'lift', 'foil'],
		/** The picker, minus the tilt so the grid stays tidy */
		picker: ['die-cut', 'shadow', 'lift', 'foil'],
		/** Following the pointer while dragged */
		ghost: ['die-cut', 'shadow']
	} satisfies Record<string, StickerEffect[]>

	// The same sticker always gets the same angle, between -6° and 6°
	function tiltFor(key: string): number {
		let hash = 0
		for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0
		return (Math.abs(hash) % 13) - 6
	}
</script>

<script lang="ts">
	/**
	 * One sticker: its image, with its meaning (in the user's language) as the
	 * alt text. Meanings come from the editor-managed catalogue, not Paraglide,
	 * and are rendered as text.
	 */
	import Icon from '$lib/components/Icon.svelte'
	import { appLocale, localizedName } from '$lib/utils/locale'
	import { stickerImageUrl } from '$lib/utils/stickers'
	import { getHostedImageUrl } from '$lib/utils/images'
	import type { Sticker } from '$lib/types/api/sticker'

	interface Props {
		sticker?: Sticker | undefined
		/** Alt text when the sticker isn't in the catalogue */
		slug?: string
		size?: number
		/** The viewer's own sticker */
		highlighted?: boolean
		effects?: StickerEffect[]
		/** An angle it was placed at; it replaces the tilt (whoever placed
		 * it turns it, so it isn't applied here) */
		rotation?: number | null
	}

	let {
		sticker,
		slug = '',
		size = 24,
		highlighted = false,
		effects = [],
		rotation = null
	}: Props = $props()

	const meaning = $derived(sticker ? localizedName(sticker.meaning) : slug)
	const src = $derived(getHostedImageUrl(stickerImageUrl(sticker, appLocale())))
	const has = (effect: StickerEffect) => effects.includes(effect)
	const tilt = $derived(has('tilt') && rotation === null ? tiltFor(sticker?.slug ?? slug) : 0)
</script>

<span
	class="sticker"
	class:highlighted
	class:die-cut={has('die-cut')}
	class:shadow={has('shadow')}
	class:lift={has('lift')}
	class:foil={has('foil') && src}
	style:--sticker-size="{size}px"
	style:--sticker-tilt="{tilt}deg"
	style:--sticker-mask={has('foil') && src ? `url("${src}")` : undefined}
>
	{#if src}
		<!-- Not draggable: the browser's own image drag would cancel ours -->
		<img {src} alt={meaning} width={size} height={size} loading="lazy" draggable="false" />
	{:else}
		<span class="fallback" aria-label={meaning}><Icon name="sticker" size={size * 0.7} /></span>
	{/if}
</span>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.sticker {
		--outline: 0px;
		--outline-color: #fff;

		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--sticker-size);
		height: var(--sticker-size);
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;
		transform: rotate(var(--sticker-tilt, 0deg));
		transition:
			transform 0.18s ease,
			filter 0.18s ease;

		// Die-cut stickers get no ring: it would sit as a circle behind the art
		&.highlighted:not(.die-cut) {
			box-shadow: 0 0 0 1px var(--accent-yellow);
			border-radius: 50%;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
			-webkit-user-drag: none;
			user-select: none;
		}

		// A border that follows the art: the image's alpha offset in eight
		// directions, scaled to the sticker
		&.die-cut {
			--outline: max(1px, calc(var(--sticker-size) / 30));

			img {
				filter: drop-shadow(var(--outline) 0 0 var(--outline-color))
					drop-shadow(calc(var(--outline) * -1) 0 0 var(--outline-color))
					drop-shadow(0 var(--outline) 0 var(--outline-color))
					drop-shadow(0 calc(var(--outline) * -1) 0 var(--outline-color));
			}
		}

		// On the wrapper, so it falls under the die-cut border too
		&.shadow {
			filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.18))
				drop-shadow(0 3px 6px rgba(0, 0, 0, 0.12));
		}

		&.lift:hover,
		:global([data-highlighted]) > &.lift {
			transform: translateY(-3px) rotate(0deg) scale(1.06);

			&.shadow {
				filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.16))
					drop-shadow(0 8px 14px rgba(0, 0, 0, 0.16));
			}
		}

		// A band of sheen that sweeps across once per hover, clipped to the art
		// with the image itself as the mask. The band starts and ends outside
		// the visible part of the gradient, so the sticker isn't left washed out.
		&.foil::after {
			content: '';
			position: absolute;
			inset: 0;
			pointer-events: none;
			background: linear-gradient(
				115deg,
				transparent 40%,
				rgba(255, 120, 200, 0.5) 45%,
				rgba(120, 220, 255, 0.5) 50%,
				rgba(255, 255, 160, 0.5) 55%,
				transparent 60%
			);
			background-size: 250% 250%;
			background-position: 100% 100%;
			mix-blend-mode: color-dodge;
			mask: var(--sticker-mask) center / contain no-repeat;
		}

		&.foil:hover::after,
		:global([data-highlighted]) > &.foil::after {
			animation: foil-sweep 0.8s ease-out;
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;

			&.lift:hover,
			:global([data-highlighted]) > &.lift {
				transform: rotate(var(--sticker-tilt, 0deg));
			}

			&.foil:hover::after,
			:global([data-highlighted]) > &.foil::after {
				animation: none;
			}
		}
	}

	@keyframes foil-sweep {
		from {
			background-position: 100% 100%;
		}
		to {
			background-position: 0% 0%;
		}
	}

	.fallback {
		display: inline-flex;
		color: var(--text-tertiary);
	}
</style>
