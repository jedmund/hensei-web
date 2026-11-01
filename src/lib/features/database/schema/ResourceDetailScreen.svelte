<script lang="ts">
	// The generated full-page detail: the page header around ResourceDetail,
	// with the tab in `?tab=`.
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { withInitialData } from '$lib/query/ssr'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import type { DetailTab } from '$lib/features/database/detail/DetailScaffold.svelte'
	import { getElementLabel } from '$lib/utils/element'
	import { getListUrl } from '$lib/utils/listNavigation'
	import { recordTitle } from './detail'
	import { resourceDef } from './registry'
	import { screenFor } from './routes'
	import ResourceDetail from './ResourceDetail.svelte'
	import type { RecordScreenData } from './types'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	let { data }: { data: RecordScreenData<unknown> } = $props()

	// The route only matches registered resources, and only ones with a record get here
	const def = $derived(resourceDef(data.resource)!)
	const recordDef = $derived(def.record!)
	const id = $derived(page.params.id ?? '')

	// Same query as the detail body (shared cache), for the header and title
	const query = createQuery(() => ({
		...recordDef.query(id),
		...withInitialData(data.record)
	}))

	const record = $derived(query.data)
	const canEdit = $derived((data.role || 0) >= 7)
	const element = $derived(
		getElementLabel(
			record ? (recordDef.element?.(record) ?? undefined) : undefined
		).toLowerCase() as ElementName | undefined
	)
	const editUrl = $derived(
		canEdit && screenFor(def, 'edit') ? `/database/${def.name}/${id}/edit` : null
	)
	const title = $derived((record && recordTitle(def, record)) || recordDef.noun())

	function handleTabChange(tab: DetailTab) {
		const url = new URL(page.url)
		if (tab === 'info') url.searchParams.delete('tab')
		else url.searchParams.set('tab', tab)
		goto(url.toString(), { replaceState: true })
	}
</script>

<PageMeta title={m.page_title_db_entity({ name: title })} description={m.page_desc_home()} />

<div class="page">
	<DatabasePageHeader title={recordDef.noun()}>
		{#snippet leftAction()}
			<Button variant="ghost" size="small" leftIcon="chevron-left" href={getListUrl(def.name)}>
				{m.db_detail_back()}
			</Button>
		{/snippet}
		{#snippet rightAction()}
			{#if editUrl}
				<Button variant="element-ghost" {element} size="small" href={editUrl}>
					{m.action_edit()}
				</Button>
			{/if}
		{/snippet}
	</DatabasePageHeader>

	<ResourceDetail
		{def}
		granblueId={id}
		initialData={data.record}
		role={data.role || 0}
		tab={page.url.searchParams.get('tab')}
		onTabChange={handleTabChange}
	/>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}
</style>
