<script lang="ts">
	import type { IRow, IColumn } from 'wx-svelte-grid'

	interface Props {
		row: IRow
		column: IColumn
	}

	const { row, column }: Props = $props()

	const value = $derived(column.getter ? column.getter(row) : row[column.id])
</script>

<div class="boolean-cell">
	{#if value}
		<span class="yes">Yes</span>
	{:else}
		<span class="no">No</span>
	{/if}
</div>

<style lang="scss">
	.boolean-cell {
		display: flex;
		align-items: center;
		height: 100%;

		.yes {
			color: var(--text-primary);
		}

		.no {
			color: var(--text-tertiary);
		}
	}
</style>
