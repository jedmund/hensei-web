<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'

	interface Props {
		page: number
		totalPages: number
		total: number
		per: number
		/** Rows on the current page */
		count: number
		paginated: boolean
		perOptions: number[]
		onPageChange: (page: number) => void
		onPerChange: (per: number) => void
	}

	const {
		page,
		totalPages,
		total,
		per,
		count,
		paginated,
		perOptions,
		onPageChange,
		onPerChange
	}: Props = $props()

	const start = $derived(total === 0 ? 0 : paginated ? (page - 1) * per + 1 : 1)
	const end = $derived(total === 0 ? 0 : start + count - 1)
	const perSelectOptions = $derived(perOptions.map((n) => ({ value: n, label: String(n) })))

	function jump(event: Event) {
		const input = event.currentTarget as HTMLInputElement
		const target = Math.min(Math.max(Math.trunc(Number(input.value)) || 1, 1), totalPages)
		input.value = String(target)
		if (target !== page) onPageChange(target)
	}
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
			<label class="per">
				<span>{m.data_table_page_size()}</span>
				<Select
					options={perSelectOptions}
					value={per}
					size="small"
					ariaLabel={m.data_table_page_size()}
					onValueChange={(value) => value && onPerChange(value)}
				/>
			</label>

			<Button
				variant="ghost"
				size="small"
				disabled={page <= 1}
				onclick={() => onPageChange(page - 1)}
			>
				{m.data_table_previous()}
			</Button>

			<label class="jump">
				<span>{m.data_table_page()}</span>
				{#key page}
					<Input
						type="number"
						size="small"
						min="1"
						max={totalPages}
						value={page}
						onchange={jump}
						aria-label={m.data_table_page()}
					/>
				{/key}
				<span>{m.data_table_page_of({ total: totalPages.toLocaleString() })}</span>
			</label>

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

	.per,
	.jump {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		white-space: nowrap;
	}

	.jump :global(input) {
		width: 4.5em;
		text-align: center;
	}
</style>
