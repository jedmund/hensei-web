<script lang="ts">
	/**
	 * Circular bookmark badge overlaid on the top-left of a unit's image to
	 * signal that the user owns this item in their collection. Element-tinted
	 * so it reads as part of the unit's chrome, with the background staying
	 * translucent enough to let the artwork show through.
	 */
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		/** Granblue element id (1=wind, 2=fire, 3=water, 4=earth, 5=dark, 6=light). */
		element?: number | null | undefined
	}

	let { element }: Props = $props()

	const elementClass = $derived.by(() => {
		switch (element) {
			case 1:
				return 'wind'
			case 2:
				return 'fire'
			case 3:
				return 'water'
			case 4:
				return 'earth'
			case 5:
				return 'dark'
			case 6:
				return 'light'
			default:
				return 'neutral'
		}
	})
</script>

<div class="bookmark-overlay {elementClass}" aria-hidden="true">
	<Icon name="bookmark" width={12} height={16} />
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/effects' as effects;

	.bookmark-overlay {
		position: absolute;
		top: spacing.$unit;
		left: spacing.$unit;
		width: 32px;
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		z-index: effects.$z-sticky;
		pointer-events: none;

		// Element-tinted background sits at 0.8 alpha so the underlying image
		// still reads through, while the foreground icon picks up the
		// matching bright tone for contrast against the translucent fill.
		&.wind {
			background: rgba($wind-text-10, 0.8);
			color: $wind-bg-20;
		}

		&.fire {
			background: rgba($fire-text-10, 0.8);
			color: $fire-bg-20;
		}

		&.water {
			background: rgba($water-text-10, 0.8);
			color: $water-bg-20;
		}

		&.earth {
			background: rgba($earth-text-10, 0.8);
			color: $earth-bg-20;
		}

		&.dark {
			background: rgba($dark-text-10, 0.8);
			color: $dark-bg-20;
		}

		&.light {
			background: rgba($light-text-10, 0.8);
			color: $light-bg-20;
		}

		&.neutral {
			background: rgba(0, 0, 0, 0.8);
			color: white;
		}
	}
</style>
