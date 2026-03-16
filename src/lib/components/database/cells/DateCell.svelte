<script lang="ts">
	import type { IRow, IColumn } from 'wx-svelte-grid'

	interface Props {
		row: IRow
		column: IColumn
	}

	const { row, column }: Props = $props()

	const rawValue = $derived(column.getter ? column.getter(row) : row[column.id])

	const formatted = $derived.by(() => {
		if (!rawValue) return '—'
		const date = new Date(rawValue)
		if (isNaN(date.getTime())) return '—'
		const year = date.getUTCFullYear()
		const month = String(date.getUTCMonth() + 1).padStart(2, '0')
		const day = String(date.getUTCDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	})
</script>

<div class="date-cell">
	<span class:empty={formatted === '—'}>{formatted}</span>
</div>

<style lang="scss">
	.date-cell {
		display: flex;
		align-items: center;
		height: 100%;

		.empty {
			color: var(--text-tertiary);
		}
	}
</style>
