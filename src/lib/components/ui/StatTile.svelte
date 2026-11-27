<!-- StatTile - A labeled number in a tile, as in the gacha simulator's result tallies -->

<script lang="ts">
	interface Props {
		label: string
		value: string
	}

	let { label, value }: Props = $props()
</script>

<div class="stat-tile">
	<span class="label">{label}</span>
	<span class="value">{value}</span>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.stat-tile {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: $unit-2x;
		border-radius: $card-corner;
		background: var(--page-bg);
	}

	.label {
		color: var(--text-secondary);
		font-size: $font-small;
		font-weight: $medium;
	}

	.value {
		font-size: $font-xxlarge;
		font-weight: $bold;
		font-variant-numeric: tabular-nums;

		// Three tiles share a row on phones
		@media (max-width: 450px) {
			font-size: $font-large;
		}
	}
</style>
