<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import type { WeaponSuggestions } from '$lib/api/adapters/entity.adapter'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import { getElementLabel, getElementOptions } from '$lib/utils/element'
	import { getProficiencyOptions } from '$lib/utils/proficiency'
	import { getSeriesDisplayName } from '$lib/utils/weaponSeries'
	import { isWeaponSeriesRef, type WeaponSeriesRef } from '$lib/types/api/weaponSeries'
	import { PROMOTION_NAMES, getPromotionNames } from '$lib/types/enums'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
		// Suggestion support for batch import
		suggestions?: WeaponSuggestions
		dismissedSuggestions?: Set<string>
		onAcceptSuggestion?: (field: string, value: any) => void
		onDismissSuggestion?: (field: string) => void
	}

	let {
		weapon,
		editMode = false,
		editData = $bindable(),
		suggestions,
		dismissedSuggestions,
		onAcceptSuggestion,
		onDismissSuggestion
	}: Props = $props()

	// Fetch weapon series list from API
	const weaponSeriesQuery = createQuery(() => entityQueries.weaponSeriesList())

	const elementOptions = getElementOptions()
	const proficiencyOptions = getProficiencyOptions()

	// Build series options from fetched data
	// In edit mode, we need IDs for the select value
	const seriesOptions = $derived.by(() => {
		const series = weaponSeriesQuery.data ?? []
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
		const el = editMode ? editData.element : weapon?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})

	// Format series label for display mode
	function formatSeriesLabel(series: WeaponSeriesRef | null | undefined): string {
		if (!series) return '—'
		return getSeriesDisplayName(series, 'en') || '—'
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
		<SuggestionDetailItem
			label="Proficiency"
			bind:value={editData.proficiency}
			editable={true}
			type="select"
			options={proficiencyOptions}
			suggestion={suggestions?.proficiency}
			dismissedSuggestion={dismissedSuggestions?.has('proficiency')}
			onAcceptSuggestion={() => onAcceptSuggestion?.('proficiency', suggestions?.proficiency)}
			onDismissSuggestion={() => onDismissSuggestion?.('proficiency')}
		/>
		<DetailItem
			label="Series"
			bind:value={editData.series}
			editable={true}
			type="select"
			options={seriesOptions}
		/>
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
		<DetailItem
			label="Promotions"
			sublabel="Gacha pools where this weapon appears"
			bind:value={editData.promotions}
			editable={true}
			type="multiselect"
			options={promotionOptions}
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
		<DetailItem label="Extra" sublabel="Can be placed in Additional Weapons" value={weapon.extra ? 'Yes' : 'No'} />
		<DetailItem label="Limit" sublabel="Only one copy can be placed in a team" value={weapon.limit ? 'Yes' : 'No'} />
		<DetailItem label="AX Skills" sublabel="Can have AX Skills" value={weapon.ax ? 'Yes' : 'No'} />
		<DetailItem label="Promotions" sublabel="Gacha pools where this weapon appears" value={formatPromotionsDisplay(weapon.promotions)} />
	{/if}
</DetailsContainer>
