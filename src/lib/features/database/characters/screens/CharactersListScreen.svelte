<script lang="ts">
	// The characters list: the generated list with the batch refresh action for
	// editors, and the Series view (`?view=series`, linked from the sidebar)
	// until character series become a resource of their own (GBF-143)
	import { page } from '$app/state'
	import { createQuery } from '@tanstack/svelte-query'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import * as m from '$lib/paraglide/messages'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import DataTable from '$lib/components/data-table/DataTable.svelte'
	import { createTableUrl } from '$lib/components/data-table/tableUrl.svelte'
	import { createStaticSource } from '$lib/components/data-table/staticSource.svelte'
	import type { DataTableColumn } from '$lib/components/data-table/types'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { EDITOR_ROLE } from '$lib/auth/roles'
	import BatchRefreshDialog from '$lib/features/database/characters/refresh/BatchRefreshDialog.svelte'
	import ResourceTable from '$lib/features/database/schema/ResourceTable.svelte'
	import { localizedName } from '$lib/utils/locale'
	import type { CharacterSeries } from '$lib/types/api/characterSeries'

	const series = $derived(page.url.searchParams.get('view') === 'series')

	// The database is editor-only already; checked again so the action never shows otherwise
	const canEdit = $derived(((page.data.role as number | undefined) ?? 0) >= EDITOR_ROLE)
	let batchRefreshOpen = $state(false)

	const seriesQuery = createQuery(() => ({
		...entityQueries.characterSeriesList(),
		enabled: series
	}))

	const seriesColumns: DataTableColumn<CharacterSeries>[] = [
		{
			id: 'order',
			header: m.db_weapon_series_col_order,
			type: 'number',
			value: (s) => s.order,
			width: '80px',
			align: 'center'
		},
		{
			id: 'name',
			header: m.db_weapon_series_col_name,
			type: 'name',
			name: (s) => s.name,
			primary: true,
			minWidth: '200px'
		},
		{
			id: 'slug',
			header: m.db_weapon_series_col_slug,
			type: 'code',
			value: (s) => s.slug,
			searchable: true,
			minWidth: '150px'
		}
	]

	const seriesUrl = createTableUrl({ defaultSort: [{ id: 'order', desc: false }] })
	const seriesSource = createStaticSource({
		url: seriesUrl,
		columns: seriesColumns,
		data: () => seriesQuery.data,
		isPending: () => seriesQuery.isPending,
		isFetching: () => seriesQuery.isFetching,
		error: () => seriesQuery.error,
		refetch: () => seriesQuery.refetch()
	})
</script>

<PageMeta title={m.page_title_db_characters()} description={m.page_desc_home()} />

{#snippet actions()}
	{#if canEdit}
		<DropdownMenu>
			{#snippet trigger({ props })}
				<Button
					variant="ghost"
					size="small"
					iconOnly
					icon="ellipsis"
					aria-label={m.character_refresh_more_actions()}
					{...props}
				/>
			{/snippet}
			{#snippet menu()}
				<DropdownMenuBase.Item class="dropdown-menu-item" onclick={() => (batchRefreshOpen = true)}>
					{m.character_refresh_batch_action()}
				</DropdownMenuBase.Item>
			{/snippet}
		</DropdownMenu>
	{/if}
{/snippet}

{#if canEdit}
	<BatchRefreshDialog bind:open={batchRefreshOpen} />
{/if}

<div class="database-page">
	{#if series}
		<DataTable
			columns={seriesColumns}
			source={seriesSource}
			rowId={(s) => s.id}
			rowHref={(s) => `/database/series/characters/${s.slug}`}
			rowTitle={(s) => localizedName(s.name)}
			storageKey="character-series"
			label={m.nav_new_character_series()}
			searchEntity={m.db_character_series_entity()}
			emptyMessage={m.db_character_series_empty()}
		/>
	{:else}
		<ResourceTable resource="characters" toolbarEnd={actions} />
	{/if}
</div>

<style lang="scss">
	.database-page {
		margin: 0 auto;
	}
</style>
