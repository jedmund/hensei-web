<svelte:options runes={true} />

<script lang="ts">
	interface Props {
		row: any
	}

	const { row }: Props = $props()
</script>

<div class="flags">
	{#if row.hl}<span class="flag hl">HL</span>{/if}
	{#if row.extra}<span class="flag extra">Extra</span>{/if}
	{#if row.guidebooks}<span class="flag guidebooks">Guidebooks</span>{/if}
	{#if !row.hl && !row.extra && !row.guidebooks}
		<span class="no-flags">—</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.flags {
		display: flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.flag {
		display: inline-block;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: typography.$font-tiny;
		font-weight: typography.$bold;

		&.hl {
			background: #dc3545;
			color: white;
		}

		&.extra {
			background: #6f42c1;
			color: white;
		}

		&.guidebooks {
			background: #28a745;
			color: white;
		}
	}

	.no-flags {
		color: #999;
	}
</style>
