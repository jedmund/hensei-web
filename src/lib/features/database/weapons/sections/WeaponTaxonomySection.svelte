
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import { getElementLabel } from '$lib/utils/element'
	import { localizedName } from '$lib/utils/locale'
	import { getProficiencyOptions } from '$lib/utils/proficiency'
	import { getSeriesDisplayName } from '$lib/utils/weaponSeries'
	import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
	}

	let {
		weapon,
		editMode = false,
		editData = $bindable()
	}: Props = $props()

	// Fetch weapon series list from API
	const weaponSeriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	// Fetch selected series detail to get variants (only in edit mode when a series is selected)
	const selectedSeriesId = $derived(editMode ? editData?.series : null)
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
		if (editMode && editData) {
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

	const proficiencyOptions = getProficiencyOptions()

	// Build series options from fetched data
	// In edit mode, we need IDs for the select value
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
		const el = editMode ? editData.element : weapon?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})

	// Format series label for display mode
	function formatSeriesLabel(series: WeaponSeriesRef | null | undefined): string {
		if (!series) return '—'
		return getSeriesDisplayName(series) || '—'
	}

	// Format variant label for display mode
	function formatVariantLabel(weapon: any): string {
		if (!weapon?.series?.weaponSeriesVariantId) return '—'
		return weapon.series.weaponSeriesVariantName || '—'
	}
</script>

<DetailsContainer title="Details">
	{#if editMode}
		<DetailItem
			label="Element"
			editable={true}
		>
			<ElementPicker
				bind:value={editData.element}
				includeAny
				mode="dropdown"
				contained
			/>
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
		<DetailItem
			label="AX Skills"
			sublabel="Can have AX Skills"
			bind:value={editData.ax}
			editable={true}
			type="checkbox"
			element={elementName}
		/>
	{:else}
		<DetailItem label="Element">
			<ElementLabel element={weapon.element} size="medium" />
		</DetailItem>
		<DetailItem label="Proficiency">
			<ProficiencyLabel
				proficiency={Array.isArray(weapon.proficiency) ? weapon.proficiency[0] : weapon.proficiency}
				size="medium"
			/>
		</DetailItem>
		<DetailItem label="Series" value={formatSeriesLabel(weapon.series)} />
		{#if weapon.series?.weaponSeriesVariantId}
			<DetailItem label="Variant" value={formatVariantLabel(weapon)} />
		{/if}
		<DetailItem
			label="Extra"
			sublabel="Can be placed in Additional Weapons"
			value={weapon.extra ? 'Yes' : 'No'}
		/>
		<DetailItem
			label="Limit"
			sublabel="Only one copy can be placed in a team"
			value={weapon.limit ? 'Yes' : 'No'}
		/>
		<DetailItem label="AX Skills" sublabel="Can have AX Skills" value={weapon.ax ? 'Yes' : 'No'} />
	{/if}
</DetailsContainer>
