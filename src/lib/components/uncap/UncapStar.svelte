<script lang="ts">
	interface Props {
		empty?: boolean
		special?: boolean
		flb?: boolean
		ulb?: boolean
		index: number
		editable?: boolean
		tabindex?: number
		size?: 'regular' | 'small'
		onStarClick: (index: number, empty: boolean) => void
	}

	let {
		empty = false,
		special = false,
		flb = false,
		ulb = false,
		index,
		editable = false,
		tabindex,
		size = 'regular',
		onStarClick
	}: Props = $props()

	function handleClick(e: Event) {
		e.stopPropagation()
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
	class:small={size === 'small'}
	class:readonly={!editable}
>
	<button type="button" class="star-button" {tabindex} onclick={handleClick} aria-label="Uncap star"
	></button>
</li>

<style lang="scss">
	.star-button {
		all: unset;
		display: block;
		width: 100%;
		height: 100%;
		cursor: pointer;
	}

	.star {
		--size: 18px;
		background-repeat: no-repeat;
		background-size: var(--size);
		display: block;
		height: var(--size);
		width: var(--size);
		cursor: pointer;

		&.readonly {
			cursor: default;
		}

		&.small {
			--size: 12px;
		}

		&:not(.readonly):hover {
			transform: scale(1.2);
		}

		&.empty,
		&.empty.mlb,
		&.empty.flb,
		&.empty.ulb,
		&.empty.special {
			background-image: url('$src/assets/icons/uncap/empty@3x.png');

			&:not(.readonly):hover {
				background-image: url('$src/assets/icons/uncap/empty-hover@3x.png');
			}
		}

		&.mlb {
			background-image: url('$src/assets/icons/uncap/yellow@3x.png');

			&:not(.readonly):hover {
				background-image: url('$src/assets/icons/uncap/yellow-hover@3x.png');
			}
		}

		&.special {
			background-image: url('$src/assets/icons/uncap/red@3x.png');

			&:not(.readonly):hover {
				background-image: url('$src/assets/icons/uncap/red-hover@3x.png');
			}
		}

		&.flb {
			background-image: url('$src/assets/icons/uncap/blue@3x.png');

			&:not(.readonly):hover {
				background-image: url('$src/assets/icons/uncap/blue-hover@3x.png');
			}
		}

		&.ulb {
			background-image: url('$src/assets/icons/uncap/purple@3x.png');

			&:not(.readonly):hover {
				background-image: url('$src/assets/icons/uncap/purple-hover@3x.png');
			}
		}

		@media (max-width: 768px) {
			--size: 14px;
			background-size: cover;

			&.small {
				--size: 12px;
			}

			&:not(.readonly):hover {
				transform: scale(1);
			}
		}
	}
</style>
