<svelte:options runes={true} />

<script lang="ts">
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { getElementLabel, getElementOptions } from '$lib/utils/element'
	import { getProficiencyLabel, getProficiencyOptions } from '$lib/utils/proficiency'
	import { getWeaponSeriesOptions, getWeaponSeriesSlug } from '$lib/utils/weaponSeries'

	interface Props {
		weapon: any
		editMode?: boolean
		editData?: any
	}

	let { weapon, editMode = false, editData = $bindable() }: Props = $props()

	const elementOptions = getElementOptions()
	const proficiencyOptions = getProficiencyOptions()
	const seriesOptions = [{ value: 0, label: 'None' }, ...getWeaponSeriesOptions()]
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
			label="New Series"
			sublabel="Secondary series classification"
			bind:value={editData.newSeries}
			editable={true}
			type="select"
			options={seriesOptions}
		/>
	{:else}
		<DetailItem label="Element" value={getElementLabel(weapon.element)} />
		<DetailItem
			label="Proficiency"
			value={getProficiencyLabel(
				Array.isArray(weapon.proficiency) ? weapon.proficiency[0] : weapon.proficiency
			)}
		/>
		{#if weapon.series}
			{@const seriesLabel = getWeaponSeriesSlug(weapon.series)}
			<DetailItem
				label="Series"
				value={seriesLabel
					? seriesLabel
							.split('_')
							.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
							.join(' ')
					: String(weapon.series)}
			/>
		{/if}
	{/if}
</DetailsContainer>
