<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import type { SummonSuggestions } from '$lib/api/adapters/entity.adapter'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import { getElementLabel, getElementOptions } from '$lib/utils/element'
	import type { SummonSeriesRef } from '$lib/types/api/summonSeries'
	import { PROMOTION_NAMES, getPromotionNames } from '$lib/types/enums'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		summon: any
		editMode?: boolean
		editData?: any
		// Suggestion support for batch import
		suggestions?: SummonSuggestions
		dismissedSuggestions?: Set<string>
		onAcceptSuggestion?: (field: string, value: any) => void
		onDismissSuggestion?: (field: string) => void
	}

	let {
		summon,
		editMode = false,
		editData = $bindable(),
		suggestions,
		dismissedSuggestions,
		onAcceptSuggestion,
		onDismissSuggestion
	}: Props = $props()

	// Fetch summon series list from API
	const summonSeriesQuery = createQuery(() => entityQueries.summonSeriesList())

	const elementOptions = getElementOptions()

	// Build series options from fetched data
	const seriesOptions = $derived.by(() => {
		const series = summonSeriesQuery.data ?? []
		return [
			{ value: '', label: 'None' },
			...series.map((s) => ({
				value: s.id,
				label: s.name.en
			}))
		]
	})

	// Promotion options for multiselect
	const promotionOptions = Object.entries(PROMOTION_NAMES).map(([value, label]) => ({
		value: Number(value),
		label
	}))

	// Get element name for checkbox theming
	const elementName = $derived.by((): ElementName | undefined => {
		const el = editMode ? editData?.element : summon?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})

	// Format series label for display mode
	function formatSeriesLabel(series: SummonSeriesRef | null | undefined): string {
		if (!series) return '—'
		return series.name?.en || '—'
	}

	// Format promotions for display
	function formatPromotionsDisplay(promotions: number[]): string {
		if (!promotions || promotions.length === 0) return '—'
		return getPromotionNames(promotions).join(', ')
	}
</script>

<DetailsContainer title="Details">
	{#if editMode}
		<SuggestionDetailItem
			label="Element"
			bind:value={editData.element}
			editable={true}
			type="select"
			options={elementOptions}
			suggestion={suggestions?.element}
			dismissedSuggestion={dismissedSuggestions?.has('element')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('element', suggestions?.element)}
			onDismissSuggestion={() => onDismissSuggestion?.('element')}
		/>
		<DetailItem
			label="Series"
			bind:value={editData.series}
			editable={true}
			type="select"
			options={seriesOptions}
		/>
		<DetailItem label="Promotions" sublabel="Gacha pools where this summon appears" editable={true}>
			<MultiSelect
				size="medium"
				options={promotionOptions}
				bind:value={editData.promotions}
				placeholder="Select promotions"
				contained
			/>
		</DetailItem>
	{:else}
		<DetailItem label="Element">
			<ElementLabel element={summon.element} size="medium" />
		</DetailItem>
		<DetailItem label="Series" value={formatSeriesLabel(summon.series)} />
		<DetailItem
			label="Promotions"
			sublabel="Gacha pools where this summon appears"
			value={formatPromotionsDisplay(summon.promotions)}
		/>
	{/if}
</DetailsContainer>
