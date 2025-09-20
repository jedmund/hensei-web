<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import { getElementLabel, getElementOptions } from '$lib/utils/element'
  import { getProficiencyLabel, getProficiencyOptions } from '$lib/utils/proficiency'

  let { weapon, editMode = false, editData = $bindable<any>() }:
    { weapon: any; editMode?: boolean; editData?: any } = $props()

  const elementOptions = getElementOptions()
  const proficiencyOptions = getProficiencyOptions()
</script>

<DetailsContainer title="Details">
  {#if editMode}
    <DetailItem label="Element" bind:value={editData.element} editable={true} type="select" options={elementOptions} />
    <DetailItem label="Proficiency 1" bind:value={editData.proficiency1} editable={true} type="select" options={proficiencyOptions} />
    <DetailItem label="Proficiency 2" bind:value={editData.proficiency2} editable={true} type="select" options={proficiencyOptions} />
  {:else}
    <DetailItem label="Element" value={getElementLabel(weapon.element)} />
    <DetailItem label="Proficiency 1" value={getProficiencyLabel(Array.isArray(weapon.proficiency) ? weapon.proficiency[0] : weapon.proficiency)} />
    {#if Array.isArray(weapon.proficiency) && weapon.proficiency[1] !== undefined}
      <DetailItem label="Proficiency 2" value={getProficiencyLabel(weapon.proficiency[1])} />
    {/if}
  {/if}
</DetailsContainer>

