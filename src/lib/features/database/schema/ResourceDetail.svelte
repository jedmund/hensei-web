<script lang="ts">
	/**
	 * A registered resource's detail body, generated from its definition: the
	 * header, an Info tab from `layout.detail`, and the definition's other
	 * tabs. The full page and the record side panel both render it.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { withInitialData } from '$lib/query/ssr'
	import DetailScaffold, {
		type DetailTab
	} from '$lib/features/database/detail/DetailScaffold.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import NotFoundPlaceholder from '$lib/components/database/NotFoundPlaceholder.svelte'
	import { getElementLabel } from '$lib/utils/element'
	import { detailLayout } from './detail'
	import { DETAIL_COMPONENTS } from './detailComponents'
	import DetailField from './DetailField.svelte'
	import type { AnyResourceDef } from './registry'
	import type { RecordBodyProps } from './types'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props extends RecordBodyProps {
		def: AnyResourceDef
		/** Server-loaded record (full page); the panel loads it through the query */
		initialData?: unknown
	}

	let { def, id, initialData, role, tab, onTabChange }: Props = $props()

	// Only resources with a `record` get a generated detail
	const recordDef = $derived(def.record!)

	const query = createQuery(() => ({
		...recordDef.query(id),
		...(initialData ? withInitialData(initialData) : {})
	}))

	const record = $derived(query.data)
	const canEdit = $derived(role >= 7)

	const tabs = $derived(
		record
			? (recordDef.tabs ?? []).filter(
					(t) => (!t.editorOnly || canEdit) && (!t.when || t.when(record))
				)
			: []
	)
	// A tab this record doesn't have (e.g. Raw Data for a non-editor) falls back to Info
	const currentTab = $derived<DetailTab>(tabs.find((t) => t.id === tab)?.id ?? 'info')
	const activeTab = $derived(tabs.find((t) => t.id === currentTab))

	const layout = $derived(record ? detailLayout(def, record) : null)

	// Link buttons take the record's element colour
	const element = $derived(
		getElementLabel(
			record ? (recordDef.element?.(record) ?? undefined) : undefined
		).toLowerCase() as ElementName | undefined
	)
</script>

{#if record && layout}
	<DetailScaffold
		type={recordDef.type}
		item={record}
		image={recordDef.image?.(record)}
		fallbackImage={recordDef.fallbackImage?.(record)}
		{currentTab}
		{onTabChange}
		showTabs={tabs.length > 0}
		tabs={tabs.map((t) => ({ value: t.id, label: t.label() }))}
	>
		{#if activeTab}
			{@const Tab = activeTab.component}
			<Tab {record} {canEdit} {role} refetch={() => query.refetch()} />
		{:else}
			<section class="details">
				{#each layout.blocks as { section, rows } (section.id)}
					{#if section.component && section.container === false}
						{@const Body = DETAIL_COMPONENTS[section.component]}
						<Body {record} />
					{:else}
						<DetailsContainer title={section.title()}>
							{#if section.component}
								{@const Body = DETAIL_COMPONENTS[section.component]}
								<Body {record} />
							{:else}
								{#each rows as row (row.field.key)}
									<DetailField
										field={row.field}
										value={row.value}
										{record}
										values={layout.values}
										{element}
									/>
								{/each}
							{/if}
						</DetailsContainer>
					{/if}
				{/each}
			</section>
		{/if}
	</DetailScaffold>
{:else if query.isPending}
	<div class="loading" aria-busy="true"></div>
{:else}
	<NotFoundPlaceholder
		title={m.db_detail_not_found_title({ noun: recordDef.noun() })}
		message={m.db_detail_not_found_message()}
		backHref="/database/{def.name}"
		backLabel={m.db_detail_back_to({ list: def.list.label() })}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/database' as database;

	.loading {
		min-height: 320px;
	}

	.details {
		@include database.details;
	}
</style>
