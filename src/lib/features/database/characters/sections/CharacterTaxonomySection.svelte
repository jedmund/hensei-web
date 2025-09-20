<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import { getElementLabel, getElementOptions } from '$lib/utils/element'
  import { getRaceLabel, getRaceOptions } from '$lib/utils/race'
  import { getGenderLabel, getGenderOptions } from '$lib/utils/gender'
  import { getProficiencyLabel, getProficiencyOptions } from '$lib/utils/proficiency'

  let {
    character,
    editMode = false,
    editData = $bindable<any>()
  }: { character: any; editMode?: boolean; editData?: any } = $props()

  const elementOptions = getElementOptions()
  const raceOptions = getRaceOptions()
  const genderOptions = getGenderOptions()
  const proficiencyOptions = getProficiencyOptions()
</script>

<DetailsContainer title="Details">
  {#if editMode}
    <DetailItem label="Element" bind:value={editData.element} editable={true} type="select" options={elementOptions} />
    <DetailItem label="Race 1" bind:value={editData.race1} editable={true} type="select" options={raceOptions} />
    <DetailItem label="Race 2" bind:value={editData.race2} editable={true} type="select" options={raceOptions} />
    <DetailItem label="Gender" bind:value={editData.gender} editable={true} type="select" options={genderOptions} />
    <DetailItem label="Proficiency 1" bind:value={editData.proficiency1} editable={true} type="select" options={proficiencyOptions} />
    <DetailItem label="Proficiency 2" bind:value={editData.proficiency2} editable={true} type="select" options={proficiencyOptions} />
  {:else}
    <DetailItem label="Element" value={getElementLabel(character.element)} />
    <DetailItem label="Race 1" value={getRaceLabel(character.race?.[0])} />
    {#if character.race?.[1]}
      <DetailItem label="Race 2" value={getRaceLabel(character.race?.[1])} />
    {/if}
    <DetailItem label="Gender" value={getGenderLabel(character.gender)} />
    <DetailItem label="Proficiency 1" value={getProficiencyLabel(character.proficiency[0])} />
    <DetailItem label="Proficiency 2" value={getProficiencyLabel(character.proficiency[1])} />
  {/if}
</DetailsContainer>

