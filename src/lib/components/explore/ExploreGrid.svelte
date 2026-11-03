<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { Party } from '$lib/types/api/party'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		items?: Party[]
		/** Passed to each card; false shows the updated time instead of the raid */
		showRaid?: boolean
		/** Custom card renderer, e.g. a GridRep with a footer */
		card?: Snippet<[Party, number]>
		/** Inside a card: outlined reps and tighter columns; a swipeable carousel on phones */
		contained?: boolean
	}

	let { items = [], showRaid = true, card, contained = false }: Props = $props()
</script>

{#if items.length === 0}
	<p class="empty">{m.explore_empty()}</p>
{:else}
	<ul class="grid" class:contained role="list">
		{#each items as p, i (i)}
			<li>
				{#if card}
					{@render card(p, i)}
				{:else}
					<GridRep party={p} {showRaid} outlined={contained} />
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/mixins' as *;

	.grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: $unit-3x;
		padding: 0;

		@include breakpoint(tablet) {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: $unit-2x;
		}
		@include breakpoint(phone) {
			grid-template-columns: 1fr;
			gap: $unit;
		}

		& > li {
			list-style: none;
		}

		// Inside a card on phones: a row of teams that swipes sideways and snaps
		// one team at a time to the center, with its neighbors peeking in. It bleeds to the
		// card's edges (the Home card's padding) so the peek isn't clipped.
		&.contained {
			gap: $unit-2x;

			@include respond-to(tablet) {
				$card-padding: calc($unit * 1.5);

				grid-template-columns: none;
				grid-auto-flow: column;
				grid-auto-columns: min(88%, 360px);
				gap: $unit;
				margin-inline: calc(-1 * #{$card-padding});
				padding-inline: $card-padding;
				scroll-padding-inline: $card-padding;
				overflow-x: auto;
				overscroll-behavior-x: contain;
				scroll-snap-type: x mandatory;
				// A deliberate exception to the browser's scrollbar: the peek shows
				// it scrolls
				scrollbar-width: none;

				&::-webkit-scrollbar {
					display: none;
				}

				// Cards snap to the center (the first and last stay at the edges)
				& > li {
					scroll-snap-align: center;
				}
			}
		}
	}

	.empty {
		padding: $unit-2x 0;
	}
</style>
