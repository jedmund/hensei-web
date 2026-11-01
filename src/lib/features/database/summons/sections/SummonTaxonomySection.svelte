<script lang="ts">
	// Import form: element and series
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import { localizedName } from '$lib/utils/locale'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData: any
	}

	let { editData = $bindable() }: Props = $props()

	// Fetch summon series list from API
	const summonSeriesQuery = createQuery(() => entityQueries.summonSeriesList())

	// Build series options from fetched data
	const seriesOptions = $derived.by(() => {
		const series = summonSeriesQuery.data ?? []
		return [
			{ value: '', label: 'None' },
			...series.map((s) => ({
				value: s.id,
				label: localizedName(s.name)
			}))
		]
	})
</script>

<DetailsContainer title="Details">
	<DetailItem label="Element" editable={true}>
		<ElementPicker bind:value={editData.element} mode="dropdown" contained />
	</DetailItem>
	<DetailItem
		label="Series"
		bind:value={editData.series}
		editable={true}
		type="select"
		options={seriesOptions}
	/>
</DetailsContainer>
