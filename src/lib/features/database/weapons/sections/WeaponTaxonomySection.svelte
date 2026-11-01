<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import { getElementLabel } from '$lib/utils/element'
	import { localizedName } from '$lib/utils/locale'
	import { getWeaponProficiencyOptions } from '$lib/utils/proficiency'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic edit data shape
		editData: any
	}

	let { editData = $bindable() }: Props = $props()

	// Fetch weapon series list from API
	const weaponSeriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	// Fetch selected series detail to get variants (when a series is selected)
	const selectedSeriesId = $derived(editData?.series)
	const selectedSeriesQuery = createQuery(() => ({
		...entityQueries.weaponSeries(selectedSeriesId ?? ''),
		enabled: !!selectedSeriesId
	}))

	const selectedSeriesData = $derived(selectedSeriesQuery.data)
	const hasVariants = $derived((selectedSeriesData?.variants?.length ?? 0) > 0)

	// Build variant options when the selected series has variants
	const variantOptions = $derived.by(() => {
		const variants = selectedSeriesData?.variants ?? []
		if (variants.length === 0) return []
		return [
			{ value: '', label: 'None' },
			...variants.map((v) => ({
				value: v.id,
				label: v.name || 'Unnamed'
			}))
		]
	})

	// Clear variant when series changes
	$effect(() => {
		if (editData) {
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const seriesId = editData.series
			// When series changes, if the current variant doesn't belong to the new series, clear it
			if (selectedSeriesData && editData.weaponSeriesVariantId) {
				const validIds = (selectedSeriesData.variants ?? []).map((v) => v.id)
				if (!validIds.includes(editData.weaponSeriesVariantId)) {
					editData.weaponSeriesVariantId = ''
				}
			}
		}
	})

	const proficiencyOptions = getWeaponProficiencyOptions()

	// Build series options from fetched data
	// The select's values are series IDs
	const seriesOptions = $derived.by(() => {
		const series = weaponSeriesQuery.data ?? []
		return [
			{ value: '', label: 'None' },
			...series.map((s) => ({
				value: s.id,
				label: localizedName(s.name)
			}))
		]
	})

	// Get element name for checkbox theming
	const elementName = $derived.by((): ElementName | undefined => {
		const label = getElementLabel(editData.element)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})
</script>

<DetailsContainer title="Details">
	<DetailItem label="Element" editable={true}>
		<ElementPicker bind:value={editData.element} includeAny mode="dropdown" contained />
	</DetailItem>
	<DetailItem
		label="Proficiency"
		bind:value={editData.proficiency}
		editable={true}
		type="select"
		options={proficiencyOptions}
	/>
	<DetailItem
		label="Series"
		bind:value={editData.series}
		editable={true}
		type="select"
		options={seriesOptions}
	/>
	{#if hasVariants}
		<DetailItem
			label="Variant"
			sublabel="Override series capabilities for this weapon"
			bind:value={editData.weaponSeriesVariantId}
			editable={true}
			type="select"
			options={variantOptions}
		/>
	{/if}
	<DetailItem
		label="Extra"
		sublabel="Can be placed in Additional Weapons"
		bind:value={editData.extra}
		editable={true}
		type="checkbox"
		element={elementName}
	/>
	<DetailItem
		label="Limit"
		sublabel="Only one copy can be placed in a team"
		bind:value={editData.limit}
		editable={true}
		type="checkbox"
		element={elementName}
	/>
</DetailsContainer>
