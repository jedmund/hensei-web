<script lang="ts">
	/**
	 * Inline circular count badge appended to a unit's name. Shows how many
	 * substitutes the slot has configured; renders nothing when there are
	 * none. Element-tinted to match CharacterTag so it reads as part of the
	 * unit's chrome rather than a generic chip.
	 */
	interface Props {
		count: number
		/** Granblue element id (1=wind, 2=fire, 3=water, 4=earth, 5=dark, 6=light). */
		element?: number | null | undefined
	}

	let { count, element }: Props = $props()

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

{#if count > 0}
	<span
		class="substitute-count-badge {elementClass}"
		title="{count} substitute{count === 1 ? '' : 's'}"
	>
		{count}
	</span>
{/if}

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.substitute-count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 16px;
		height: 16px;
		padding: 0 $unit-half;
		border-radius: 999px;
		font-size: $font-tiny;
		font-weight: 600;
		line-height: 1;
		vertical-align: middle;

		&.wind {
			background-color: $wind-bg-20;
			color: $wind-text-20;
		}

		&.fire {
			background-color: $fire-bg-20;
			color: $fire-text-20;
		}

		&.water {
			background-color: $water-bg-20;
			color: $water-text-20;
		}

		&.earth {
			background-color: $earth-bg-20;
			color: $earth-text-20;
		}

		&.dark {
			background-color: $dark-bg-20;
			color: $dark-text-20;
		}

		&.light {
			background-color: $light-bg-20;
			color: $light-text-20;
		}

		&.neutral {
			background-color: $grey-80;
			color: $grey-40;
		}
	}

	// Dark mode adjustments mirror CharacterTag.
	:global(.dark) .substitute-count-badge {
		&.wind {
			background-color: $wind-text-10;
			color: $wind-bg-20;
		}

		&.fire {
			background-color: $fire-text-10;
			color: $fire-bg-20;
		}

		&.water {
			background-color: $water-text-10;
			color: $water-bg-20;
		}

		&.earth {
			background-color: $earth-text-10;
			color: $earth-bg-20;
		}

		&.dark {
			background-color: $dark-text-10;
			color: $dark-bg-20;
		}

		&.light {
			background-color: $light-text-10;
			color: $light-bg-20;
		}

		&.neutral {
			background-color: $grey-30;
			color: $grey-80;
		}
	}
</style>
