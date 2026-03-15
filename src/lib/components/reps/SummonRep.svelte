<script lang="ts">
	import type { Party, GridSummon } from '$lib/types/api/party'
	import { getSummonImage } from '$lib/features/database/detail/image'
	import { getSummonTransformation } from '$lib/utils/images'

	interface Props {
		party?: Party
		summons?: GridSummon[]
		extendedView?: boolean
	}

	let { party, summons: directSummons, extendedView = false }: Props = $props()

	// Use direct summons if provided, otherwise get from party
	const summons = $derived(directSummons || party?.summons || [])
	const main = $derived(summons.find((s: GridSummon) => s?.main || s?.position === -1))
	const friend = $derived(summons.find((s: GridSummon) => s?.friend || s?.position === -2))

	// Always show positions 0-5 (6 summons including subauras)
	const grid = $derived(
		Array.from({ length: 6 }, (_, i) => summons.find((s: GridSummon) => s?.position === i))
	)

	// Transparent SVG placeholders with correct aspect ratios for grid sizing
	// Main/friend: 56x97, Grid: 184x138
	const mainPlaceholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 97'%3E%3C/svg%3E`
	const gridPlaceholder = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 184 138'%3E%3C/svg%3E`

	function summonImageUrl(s?: GridSummon, isMain = false): string {
		const id = s?.summon?.granblueId
		if (!id) return isMain ? mainPlaceholder : gridPlaceholder
		const size = isMain ? 'main' : 'grid'
		const transformation = getSummonTransformation(id, s?.uncapLevel, s?.transcendenceStep)
		return getSummonImage(id, size, transformation)
	}
</script>

<div class="rep" class:extended={extendedView}>
	<div class="mainSummon" class:empty={!main}>
		<img
			alt={main ? 'Main Summon' : ''}
			src={summonImageUrl(main, true)}
			loading="lazy"
			decoding="async"
		/>
	</div>
	<ul class="summons">
		{#each grid as s, i}
			<li class="summon" class:empty={!s}>
				<img alt={s ? 'Summon' : ''} src={summonImageUrl(s)} loading="lazy" decoding="async" />
			</li>
		{/each}
	</ul>
	<div class="friendSummon" class:empty={!friend}>
		<img
			alt={friend ? 'Friend Summon' : ''}
			src={summonImageUrl(friend, true)}
			loading="lazy"
			decoding="async"
		/>
	</div>
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

		// Layout: main summon | 6 grid summons (3x2) | friend summon
		grid-template-columns: auto 1fr auto;
		grid-template-rows: 1fr;

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

		.mainSummon,
		.friendSummon {
			@include rep.aspect(rep.$summon-main-w, rep.$summon-main-h);
			height: calc(100% - 6px);
			align-self: center;
		}

		.summons {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			grid-template-rows: repeat(3, auto);
			align-content: space-between;
			column-gap: $unit-half;
			margin: 0;
			padding: 0;
			list-style: none;
			height: calc(100% - 6px);
			align-self: center;
		}

		.summon {
			background: var(--unit-bg);
			border-radius: $item-corner-small;
			overflow: hidden;
			min-width: 43px;
			display: grid;
			@include rep.aspect(rep.$summon-cell-w, rep.$summon-cell-h);
		}
	}
</style>
