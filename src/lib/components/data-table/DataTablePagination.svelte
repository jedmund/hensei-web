<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		page: number
		totalPages: number
		total: number
		per: number
		/** Rows on the current page */
		count: number
		paginated: boolean
		onPageChange: (page: number) => void
	}

	const { page, totalPages, total, per, count, paginated, onPageChange }: Props = $props()

	const start = $derived(total === 0 ? 0 : paginated ? (page - 1) * per + 1 : 1)
	const end = $derived(total === 0 ? 0 : start + count - 1)
</script>

<div class="footer">
	<span class="range" aria-live="polite">
		{m.data_table_range({
			start: start.toLocaleString(),
			end: end.toLocaleString(),
			total: total.toLocaleString()
		})}
	</span>

	{#if paginated}
		<nav class="controls" aria-label={m.data_table_pagination()}>
			<Button
				variant="ghost"
				size="small"
				disabled={page <= 1}
				onclick={() => onPageChange(page - 1)}
			>
				{m.data_table_previous()}
			</Button>

			<span class="page">
				{m.data_table_page_status({
					page: page.toLocaleString(),
					total: totalPages.toLocaleString()
				})}
			</span>

			<Button
				variant="ghost"
				size="small"
				disabled={page >= totalPages}
				onclick={() => onPageChange(page + 1)}
			>
				{m.data_table_next()}
			</Button>
		</nav>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x;
		border-top: 1px solid var(--border-subtle);
		background: var(--bar-bg);
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.range {
		font-variant-numeric: tabular-nums;
	}

	.controls {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.page {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
