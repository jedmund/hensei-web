<svelte:options runes={true} />

<script lang="ts">
	interface Props {
		empty?: boolean
		special?: boolean
		flb?: boolean
		ulb?: boolean
		index: number
		tabIndex?: number
		onStarClick: (index: number, empty: boolean) => void
	}

	let {
		empty = false,
		special = false,
		flb = false,
		ulb = false,
		index,
		tabIndex,
		onStarClick
	}: Props = $props()

	function handleClick() {
		onStarClick(index, empty)
	}
</script>

<li
	class="star"
	class:empty
	class:special
	class:mlb={!special}
	class:flb
	class:ulb
	{tabIndex}
	onclick={handleClick}
	role="button"
	aria-label="Uncap star"
></li>

<style lang="scss">
	.star {
		--size: 18px;
		background-repeat: no-repeat;
		background-size: var(--size);
		display: block;
		height: var(--size);
		width: var(--size);
		cursor: pointer;

		&:hover {
			transform: scale(1.2);
		}

		&.empty,
		&.empty.mlb,
		&.empty.flb,
		&.empty.ulb,
		&.empty.special {
			background-image: url('/icons/uncap/empty@3x.png');

			&:hover {
				background-image: url('/icons/uncap/empty-hover@3x.png');
			}
		}

		&.mlb {
			background-image: url('/icons/uncap/yellow@3x.png');

			&:hover {
				background-image: url('/icons/uncap/yellow-hover@3x.png');
			}
		}

		&.special {
			background-image: url('/icons/uncap/red@3x.png');

			&:hover {
				background-image: url('/icons/uncap/red-hover@3x.png');
			}
		}

		&.flb {
			background-image: url('/icons/uncap/blue@3x.png');

			&:hover {
				background-image: url('/icons/uncap/blue-hover@3x.png');
			}
		}

		&.ulb {
			background-image: url('/icons/uncap/purple@3x.png');

			&:hover {
				background-image: url('/icons/uncap/purple-hover@3x.png');
			}
		}

		@media (max-width: 768px) {
			--size: 14px;
			background-size: cover;

			&:hover {
				transform: scale(1);
			}
		}
	}
</style>