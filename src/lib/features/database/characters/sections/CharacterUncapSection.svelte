<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
  import { getCharacterMaxUncapLevel } from '$lib/utils/uncap'

  let {
    character,
    editMode = false,
    editData = $bindable<any>()
  }: { character: any; editMode?: boolean; editData?: any } = $props()

  const uncap = $derived(
    editMode
      ? { flb: editData.flb, ulb: editData.ulb, transcendence: editData.transcendence }
      : (character?.uncap ?? {})
  )
  const flb = $derived(uncap.flb ?? false)
  const ulb = $derived(uncap.ulb ?? false)
  const transcendence = $derived(uncap.transcendence ?? false)
  const special = $derived(editMode ? editData.special : (character?.special ?? false))
  const uncapLevel = $derived(getCharacterMaxUncapLevel({ special, uncap }))
  const transcendenceStage = $derived(transcendence ? 5 : 0)
</script>

<DetailsContainer title="Details">
  {#if character.uncap}
    <DetailItem label="Uncap">
      <UncapIndicator
        type="character"
        {uncapLevel}
        {transcendenceStage}
        {flb}
        {ulb}
        {transcendence}
        {special}
        editable={false}
      />
    </DetailItem>
  {/if}

  {#if editMode}
    <DetailItem label="FLB" bind:value={editData.flb} editable={true} type="checkbox" />
    <DetailItem label="ULB" bind:value={editData.ulb} editable={true} type="checkbox" />
    <DetailItem label="Transcendence" bind:value={editData.transcendence} editable={true} type="checkbox" />
    <DetailItem label="Special" bind:value={editData.special} editable={true} type="checkbox" />
  {/if}
</DetailsContainer>

