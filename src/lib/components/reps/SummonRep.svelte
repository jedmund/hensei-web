<script lang="ts">
	import type { PartyView, GridSummonItemView } from '$lib/api/schemas/party'

	export let party: PartyView
	export let extendedView = false

	const summons = party.summons || []
	const main = summons.find((s: any) => s?.main || s?.position === -1)
	const friend = extendedView
		? summons.find((s: any) => s?.friend || s?.position === -2)
		: undefined

	// In standard view: show positions 0-3 (4 summons)
	// In extended view: show positions 0-5 (6 summons including subauras)
	const gridLength = extendedView ? 6 : 4
	const grid = Array.from({ length: gridLength }, (_, i) =>
		summons.find((s: any) => s?.position === i)
	)

	function summonImageUrl(s?: any, isMain = false): string {
		const id = s?.object?.granblueId
		if (!id) return ''
		const folder = isMain ? 'summon-main' : 'summon-grid'
		return `/images/${folder}/${id}.jpg`
	}
</script>

<div class="rep" class:extended={extendedView}>
	<div class="mainSummon">
		{#if main}<img alt="Main Summon" src={summonImageUrl(main, true)} />{/if}
	</div>
	<ul class="summons">
		{#each grid as s, i}
			<li class="summon">
				{#if s}<img alt="Summon" src={summonImageUrl(s)} />{/if}
			</li>
		{/each}
	</ul>
	{#if extendedView}
		<div class="friendSummon">
			{#if friend}<img alt="Friend Summon" src={summonImageUrl(friend, true)} />{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/rep' as rep;

	.rep {
		width: 100%;
		height: 100%;
		display: grid;
		grid-template-columns: 1fr #{rep.$summon-cols-proportion}fr;
		grid-gap: $unit-half;
	}

	// Extended view layout: main summon | 6 grid summons | friend summon
	.rep.extended {
		display: flex;
		gap: $unit-half;
		grid-template-columns: none;
		box-sizing: border-box;
	}

	.summon,
	.mainSummon,
	.friendSummon {
		background: var(--card-bg);
		border-radius: 4px;
	}

	.mainSummon {
		@include rep.aspect(56, 97);
		display: grid;
	}

	.extended .mainSummon,
	.extended .friendSummon {
		@include rep.aspect(56, 97);
		display: grid;
		flex: 0 0 auto;
	}

	.summons {
		@include rep.grid(2, 2, $unit-half);
	}

	.extended .summons {
		display: grid;
		grid-template-rows: repeat(3, 1fr);
		grid-template-columns: repeat(2, 1fr);
		gap: $unit-half;
		flex: 1 1 0;
		min-width: 0; /* allow grid to shrink without overflowing */
	}

	.summon {
		@include rep.aspect(184, 138);
		display: grid;
	}

	.summon img,
	.mainSummon img,
	.friendSummon img {
		border-radius: 4px;
		width: 100%;
		height: 100%;
	}
</style>
