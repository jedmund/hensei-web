<script lang="ts">
	import type { Snippet } from 'svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import type { RowHeight } from './types'

	export interface ColumnToggle {
		id: string
		label: string
		visible: boolean
		canHide: boolean
	}

	interface Props {
		searchable: boolean
		search: string
		onSearch: (q: string) => void
		columns: ColumnToggle[]
		onToggleColumn: (id: string, visible: boolean) => void
		hasCustomColumns: boolean
		onResetColumns: () => void
		rowHeight: RowHeight
		onRowHeight: (value: RowHeight) => void
		start?: Snippet | undefined
		end?: Snippet | undefined
	}

	const {
		searchable,
		search,
		onSearch,
		columns,
		onToggleColumn,
		hasCustomColumns,
		onResetColumns,
		rowHeight,
		onRowHeight,
		start,
		end
	}: Props = $props()

	const SEARCH_DEBOUNCE_MS = 250

	// Local copy so typing stays responsive; follows the URL when it changes elsewhere
	let draft = $derived(search)
	let timer: ReturnType<typeof setTimeout> | undefined

	function handleInput(event: Event) {
		draft = (event.currentTarget as HTMLInputElement).value
		clearTimeout(timer)
		timer = setTimeout(() => onSearch(draft), SEARCH_DEBOUNCE_MS)
	}

	function handleClear() {
		clearTimeout(timer)
		draft = ''
		onSearch('')
	}

	$effect(() => () => clearTimeout(timer))

	const rowHeights: { value: RowHeight; label: () => string }[] = [
		{ value: 'compact', label: m.data_table_row_height_compact },
		{ value: 'default', label: m.data_table_row_height_default },
		{ value: 'image', label: m.data_table_row_height_image }
	]
</script>

<div class="toolbar">
	{@render start?.()}

	<div class="end">
		{#if searchable}
			<div class="search">
				<Input
					type="search"
					size="small"
					leftIcon="search"
					clearable
					value={draft}
					placeholder={m.data_table_search()}
					aria-label={m.data_table_search_label()}
					oninput={handleInput}
					onClear={handleClear}
				/>
			</div>
		{/if}

		<DropdownMenu align="end">
			{#snippet trigger({ props })}
				<Button {...props} variant="ghost" size="small" rightIcon="chevron-down-small">
					{m.data_table_columns()}
				</Button>
			{/snippet}
			{#snippet menu()}
				{#each columns.filter((c) => c.canHide) as column (column.id)}
					<DropdownMenuBase.CheckboxItem
						checked={column.visible}
						onCheckedChange={(checked) => onToggleColumn(column.id, checked)}
						closeOnSelect={false}
						class="dropdown-menu-item"
					>
						{#snippet children({ checked })}
							{column.label}
							{#if checked}
								<span class="dropdown-menu-check"><Icon name="check" size={14} /></span>
							{/if}
						{/snippet}
					</DropdownMenuBase.CheckboxItem>
				{/each}

				<DropdownMenuBase.Separator class="dropdown-menu-separator" />
				<DropdownMenuBase.Group>
					<DropdownMenuBase.GroupHeading class="data-table-menu-label">
						{m.data_table_row_height()}
					</DropdownMenuBase.GroupHeading>
					<DropdownMenuBase.RadioGroup
						value={rowHeight}
						onValueChange={(value) => onRowHeight(value as RowHeight)}
					>
						{#each rowHeights as option (option.value)}
							<DropdownMenuBase.RadioItem
								value={option.value}
								closeOnSelect={false}
								class="dropdown-menu-item"
							>
								{#snippet children({ checked })}
									{option.label()}
									{#if checked}
										<span class="dropdown-menu-check"><Icon name="check" size={14} /></span>
									{/if}
								{/snippet}
							</DropdownMenuBase.RadioItem>
						{/each}
					</DropdownMenuBase.RadioGroup>
				</DropdownMenuBase.Group>

				{#if hasCustomColumns}
					<DropdownMenuBase.Separator class="dropdown-menu-separator" />
					<DropdownMenuBase.Item class="dropdown-menu-item" onSelect={onResetColumns}>
						{m.data_table_columns_reset()}
					</DropdownMenuBase.Item>
				{/if}
			{/snippet}
		</DropdownMenu>

		{@render end?.()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
	}

	.end {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		margin-left: auto;
	}

	.search {
		width: 220px;
	}

	/* The menu is portalled, so its heading style has to be global */
	:global(.data-table-menu-label) {
		padding: spacing.$unit-half spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
