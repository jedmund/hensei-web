<script lang="ts">
	import type { Party, GridSummon } from '$lib/types/api/party'
	import { getSummonImage } from '$lib/features/database/detail/image'

	interface Props {
		party?: Party
		summons?: GridSummon[]
		extendedView?: boolean
	}

	let { party, summons: directSummons, extendedView = false }: Props = $props()

	// Use direct summons if provided, otherwise get from party (note: API returns gridSummons)
	const summons = $derived(directSummons || party?.gridSummons || [])
	const main = $derived(summons.find((s: GridSummon) => s?.main || s?.position === -1))
	const friend = $derived(
		extendedView ? summons.find((s: GridSummon) => s?.friend || s?.position === -2) : undefined
	)

	// In standard view: show positions 0-3 (4 summons)
	// In extended view: show positions 0-5 (6 summons including subauras)
	const gridLength = $derived(extendedView ? 6 : 4)
	const grid = $derived(
		Array.from({ length: gridLength }, (_, i) => summons.find((s: GridSummon) => s?.position === i))
	)

	function summonImageUrl(s?: GridSummon, isMain = false): string {
		const id = s?.summon?.granblueId
		if (!id) return ''
		const folder = isMain ? 'summon-main' : 'summon-grid'
		return `/images/${folder}/${id}.jpg`
	}
</script>

<div class="rep" class:extended={extendedView}>
	<div class="mainSummon" class:empty={!main}>
		{#if main}<img
				alt="Main Summon"
				src={summonImageUrl(main, true)}
				loading="lazy"
				decoding="async"
			/>{/if}
	</div>
	<ul class="summons">
		{#each grid as s, i}
			<li class="summon" class:empty={!s}>
				{#if s}<img alt="Summon" src={summonImageUrl(s)} loading="lazy" decoding="async" />{/if}
			</li>
		{/each}
	</ul>
	{#if extendedView}
		<div class="friendSummon" class:empty={!friend}>
			{#if friend}<img
					alt="Friend Summon"
					src={summonImageUrl(friend, true)}
					loading="lazy"
					decoding="async"
				/>{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/rep' as rep;

	.rep {
		width: 100%;
		height: 100%;
		display: grid;
		gap: $unit-half;

		// Standard view layout: main summon | 4 grid summons
		grid-template-columns: 0.96fr 2.2fr;
		grid-template-rows: 1fr;

		// Extended view layout: main summon | 6 grid summons | friend summon
		&.extended {
			gap: calc($unit-half + 1px);
			grid-template-columns: auto 1fr auto;

			.mainSummon {
				min-width: 69px;
			}

			.mainSummon,
			.friendSummon {
				@include rep.aspect(56, 97);
				display: grid;
				flex: 0 0 auto;
				min-width: 70px;
				height: 100%;
			}

			.summons {
				display: grid;
				grid-template-rows: repeat(3, 1fr);
				grid-template-columns: repeat(2, 1fr);
				column-gap: calc($unit-half + 1px);
				row-gap: calc($unit * 1.5 - 2px);
				min-width: 0; /* allow grid to shrink without overflowing */
			}
		}

		.summon,
		.mainSummon,
		.friendSummon {
			background: var(--unit-bg);
			border-radius: $item-corner-small;
			overflow: hidden;

			&.empty {
				background: var(--placeholder-bg);
				box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
			}

			img {
				display: block;
				width: 100%;
				height: 100%;
			}
		}

		.mainSummon {
			@include rep.aspect(56, 97);
			display: grid;
			max-width: 70px;
			height: auto;
		}

		.summons {
			@include rep.grid(2, 2, $unit-half);
			margin: 0;
			padding: 0;
			list-style: none;
			align-content: center; // Center the grid vertically
		}

		.summon {
			background: var(--unit-bg);
			border-radius: $item-corner-small;
			overflow: hidden;
			min-width: 43px;
			display: grid;
			@include rep.aspect(184, 138);
		}
	}
</style>
