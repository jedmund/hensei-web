<svelte:options runes={true} />

<script lang="ts">
	import type { GridSummon } from '$lib/types/api/party'
	import { getContext } from 'svelte'
	import type { PartyContext } from '$lib/services/party.service'

	interface Props {
		summons?: GridSummon[]
	}

	let { summons = [] }: Props = $props()

	import SummonUnit from '$lib/components/units/SummonUnit.svelte'
	import ExtraSummons from '$lib/components/extra/ExtraSummonsGrid.svelte'

	const ctx = getContext<PartyContext>('party')

	let main = $derived(summons.find((s) => s.main || s.position === -1))
	let friend = $derived(summons.find((s) => s.friend || s.position === 6))
</script>

<div class="wrapper">
	<div class="grid">
		<div class="LabeledUnit">
			<div class="label">Main</div>
			<SummonUnit item={main} position={-1} />
		</div>

		<section>
			<div class="label">Summons</div>
			<ul class="summons">
				{#each Array(4) as _, i}
					{@const summon = summons.find((s) => s.position === i)}
					<li
						aria-label={`Summon slot ${i}`}
						class:Empty={!summon}
					>
						<SummonUnit item={summon} position={i} />
					</li>
				{/each}
			</ul>
		</section>

		<div class="LabeledUnit">
			<div class="label friend">Friend</div>
			<SummonUnit item={friend} position={6} />
		</div>
	</div>
	<ExtraSummons {summons} offset={4} />
</div>

<style lang="scss">
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/mixins' as *;

	.grid {
		display: grid;
		grid-template-columns: 1.17fr 2fr 1.17fr;
		gap: $unit-3x;
		justify-content: center;
		margin: 0 auto;
		max-width: $grid-width;

		@include breakpoint(tablet) {
			gap: $unit-2x;
		}

		@include breakpoint(phone) {
			gap: $unit;
		}

		& .label {
			color: $grey-55;
			font-size: $font-tiny;
			font-weight: $medium;
			margin-bottom: $unit;
			text-align: center;
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;

			@include breakpoint(phone) {
				&.friend {
					max-width: 78px;
				}
			}
		}

		.summons {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			grid-template-rows: repeat(2, minmax(0, 1fr));
			gap: $unit-3x;

			@include breakpoint(tablet) {
				gap: $unit-2x;
			}

			@include breakpoint(phone) {
				gap: $unit;
			}

			& > li {
				list-style: none;
			}
		}
	}

	.unit {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
	}

	.image {
		width: 100%;
		height: auto;
		border: 1px solid $grey-75;
		border-radius: 8px;
		display: block;
	}

	.name {
		font-size: $font-small;
		text-align: center;
		color: $grey-50;
	}
</style>
