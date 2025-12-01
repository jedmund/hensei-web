<svelte:options runes={true} />

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import { getElementLabel, getElementOptions } from '$lib/utils/element'
	import { getProficiencyOptions } from '$lib/utils/proficiency'
	import { getWeaponSeriesOptions, getWeaponSeriesSlug } from '$lib/utils/weaponSeries'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
	}

	let { weapon, editMode = false, editData = $bindable() }: Props = $props()

	const elementOptions = getElementOptions()
	const proficiencyOptions = getProficiencyOptions()
	const seriesOptions = [{ value: 0, label: 'None' }, ...getWeaponSeriesOptions()]

	// Get element name for checkbox theming
	const elementName = $derived.by((): ElementName | undefined => {
		const el = editMode ? editData.element : weapon?.element
		const label = getElementLabel(el)
		return label !== '—' && label !== 'Null' ? (label.toLowerCase() as ElementName) : undefined
	})

	// Format series label
	function formatSeriesLabel(series: number | undefined): string {
		if (!series) return '—'
		const seriesSlug = getWeaponSeriesSlug(series)
		if (!seriesSlug) return String(series)
		return seriesSlug
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ')
	}
</script>

<DetailsContainer title="Details">
	{#if editMode}
		<DetailItem
			label="Element"
			bind:value={editData.element}
			editable={true}
			type="select"
			options={elementOptions}
		/>
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
		<DetailItem label="Extra" sublabel="Can be placed in Additional Weapons" value={weapon.extra ? 'Yes' : 'No'} />
		<DetailItem label="Limit" sublabel="Only one copy can be placed in a team" value={weapon.limit ? 'Yes' : 'No'} />
		<DetailItem label="AX Skills" sublabel="Can have AX Skills" value={weapon.ax ? 'Yes' : 'No'} />
	{/if}
</DetailsContainer>
