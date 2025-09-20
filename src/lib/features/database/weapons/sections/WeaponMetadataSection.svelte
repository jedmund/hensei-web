<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'

  let { weapon, editMode = false, editData = $bindable<any>() }:
    { weapon: any; editMode?: boolean; editData?: any } = $props()

  const rarityOptions = getRarityOptions()
</script>

<DetailsContainer title="Metadata">
  {#if editMode}
    <DetailItem label="Rarity" bind:value={editData.rarity} editable={true} type="select" options={rarityOptions} />
    <DetailItem label="Granblue ID" bind:value={editData.granblue_id} editable={true} type="text" />
  {:else}
    <DetailItem label="Rarity" value={getRarityLabel(weapon.rarity)} />
    <DetailItem label="Granblue ID" value={weapon.granblue_id} />
  {/if}
</DetailsContainer>

