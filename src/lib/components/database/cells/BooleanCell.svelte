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
		<span class="yes {column.yesClass ?? ''}">Yes</span>
	{:else}
		<span class="no">No</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.boolean-cell {
		display: flex;
		align-items: center;
		height: 100%;

		.yes {
			color: var(--text-primary);

			&:global(.extra) {
				color: var(--extra-purple-primary);
				font-weight: typography.$bold;
			}
		}

		.no {
			color: var(--text-tertiary);
		}
	}
</style>
