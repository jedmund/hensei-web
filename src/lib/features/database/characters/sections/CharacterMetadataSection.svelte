<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'

  interface Props {
    character: any
    editMode?: boolean
    editData?: any
  }

  let { character, editMode = false, editData = $bindable() }: Props = $props()

  const rarityOptions = getRarityOptions()
</script>

<DetailsContainer title="Metadata">
  {#if editMode}
    <DetailItem label="Rarity" bind:value={editData.rarity} editable={true} type="select" options={rarityOptions} />
    <DetailItem label="Granblue ID" bind:value={editData.granblueId} editable={true} type="text" />
    <DetailItem label="Character ID" bind:value={editData.characterId} editable={true} type="number" />
  {:else}
    <DetailItem label="Rarity" value={getRarityLabel(character.rarity)} />
    <DetailItem label="Granblue ID" value={character.granblueId} />
  {/if}
</DetailsContainer>

