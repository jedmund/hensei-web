<script lang="ts">
	// A reference list's input, by the resource it points at: a multi-select
	// of character series, in their display order
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import { localizedName } from '$lib/utils/locale'
	import type { InputProps } from './types'

	let { field, form }: InputProps = $props()

	const resource = $derived(field.kind === 'referenceList' ? field.resource : null)

	const seriesQuery = createQuery(() => ({
		...entityQueries.characterSeriesList(),
		enabled: resource === 'characterSeries'
	}))

	const options = $derived(
		resource === 'characterSeries'
			? (seriesQuery.data ?? [])
					.toSorted((a, b) => a.order - b.order)
					.map((s) => ({ value: s.id, label: localizedName(s.name) }))
			: []
	)
</script>

<DetailItem
	label={field.label()}
	sublabel={field.sublabel?.()}
	error={form.error(field.key)}
	editable
>
	<MultiSelect
		size="medium"
		{options}
		bind:value={() => (form.values[field.key] ?? []) as string[], (v) => form.set(field.key, v)}
		placeholder={m.db_field_select()}
		contained
	/>
</DetailItem>
