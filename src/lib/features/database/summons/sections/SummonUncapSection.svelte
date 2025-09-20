<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'

  let { summon, editMode = false, editData = $bindable<any>() }:
    { summon: any; editMode?: boolean; editData?: any } = $props()

  const flb = $derived(editMode ? Boolean(editData.flb) : Boolean(summon?.uncap?.flb))
  const ulb = $derived(editMode ? Boolean(editData.ulb) : Boolean(summon?.uncap?.ulb))
  const transcendence = $derived(editMode ? Boolean(editData.transcendence) : Boolean(summon?.uncap?.transcendence))
</script>

<DetailsContainer title="Uncap">
  <DetailItem label="Uncap">
    <UncapIndicator type="summon" {flb} {ulb} {transcendence} editable={false} />
  </DetailItem>

  {#if editMode}
    <DetailItem label="FLB" bind:value={editData.flb} editable={true} type="checkbox" />
    <DetailItem label="ULB" bind:value={editData.ulb} editable={true} type="checkbox" />
    <DetailItem label="Transcendence" bind:value={editData.transcendence} editable={true} type="checkbox" />
  {/if}
</DetailsContainer>

