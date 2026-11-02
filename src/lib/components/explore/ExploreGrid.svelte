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
		/** Inside a card: outlined reps, tighter columns, and one column of at most 4 on narrow screens */
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

		// Inside a card on narrow screens: one column, at most 4 teams
		&.contained {
			gap: $unit-2x;

			@include respond-to(tablet) {
				grid-template-columns: 1fr;
				gap: $unit;

				& > li:nth-child(n + 5) {
					display: none;
				}
			}
		}
	}

	.empty {
		padding: $unit-2x 0;
	}
</style>
