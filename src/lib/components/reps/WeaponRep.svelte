<script lang="ts">
	import type { Party, GridWeapon } from '$lib/types/api/party'

	interface Props {
		party?: Party
		weapons?: GridWeapon[]
	}

	let { party, weapons: directWeapons }: Props = $props()

	// Use direct weapons if provided, otherwise get from party
	const weapons = $derived(directWeapons || party?.weapons || [])
	const mainhand = $derived(weapons.find((w: GridWeapon) => w?.mainhand || w?.position === -1))
	const grid = $derived(
		Array.from({ length: 9 }, (_, i) => weapons.find((w: GridWeapon) => w?.position === i))
	)

	function weaponImageUrl(w?: GridWeapon, isMain = false): string {
		const id = w?.weapon?.granblueId
		if (!id) return ''
		const folder = isMain ? 'weapon-main' : 'weapon-grid'
		const objElement = w?.weapon?.element
		const instElement = w?.element
		if (objElement === 0 && instElement) return `/images/${folder}/${id}_${instElement}.jpg`
		return `/images/${folder}/${id}.jpg`
	}
</script>

<div class="rep">
	<div class="mainhand" class:empty={!mainhand}>
		{#if mainhand}<img
				alt="Mainhand"
				src={weaponImageUrl(mainhand, true)}
				loading="lazy"
				decoding="async"
			/>{/if}
	</div>
	<div class="weapons">
		{#each Array.from( { length: 3 }, (_, rowIndex) => grid.slice(rowIndex * 3, (rowIndex + 1) * 3) ) as row, rowIndex}
			<ul class="weapon-row">
				{#each row as w, colIndex}
					<li class="weapon" class:empty={!w}>
						{#if w}<img alt="Weapon" src={weaponImageUrl(w)} loading="lazy" decoding="async" />{/if}
					</li>
				{/each}
			</ul>
		{/each}
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
		grid-template-columns: 1.11fr #{rep.$weapon-cols-proportion}fr;
		gap: $unit-half;

		.mainhand {
			background: var(--placeholder-bg);
			border-radius: $item-corner-small;
			@include rep.aspect(rep.$weapon-main-w, rep.$weapon-main-h);
			overflow: hidden;
			min-height: 115px;

			&.empty {
				background: var(--placeholder-bg);
				box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
			}

			img {
				display: block;
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.weapons {
			display: flex;
			flex-direction: column;
			gap: $unit;
			height: 100%;

			.weapon-row {
				display: grid;
				grid-template-columns: repeat(3, 1fr);
				gap: $unit-half;
				margin: 0;
				padding: 0;
				list-style: none;
				flex: 1;

				.weapon {
					background: var(--unit-bg);
					border-radius: $item-corner-small;
					overflow: hidden;
					display: flex;
					align-items: center;
					justify-content: center;

					&.empty {
						background: var(--placeholder-bg);
						box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
					}

					img {
						border-radius: $item-corner-small;
						display: block;
						max-width: 100%;
						max-height: 100%;
						object-fit: contain;
					}
				}
			}
		}
	}
</style>
