<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import CopyableText from '$lib/components/ui/CopyableText.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'

  interface Props {
    weapon: any
    editMode?: boolean
    editData?: any
  }

  let {
    weapon,
    editMode = false,
    editData = $bindable<any>()
  }: Props = $props()

  const rarityOptions = getRarityOptions()
</script>

<DetailsContainer title="Metadata">
  {#if editMode}
    <DetailItem
      label="Name (EN)"
      bind:value={editData.name}
      editable={true}
      type="text"
      placeholder="English name"
    />
    <DetailItem
      label="Name (JP)"
      bind:value={editData.nameJp}
      editable={true}
      type="text"
      placeholder="日本語名"
    />
    <DetailItem
      label="Rarity"
      bind:value={editData.rarity}
      editable={true}
      type="select"
      options={rarityOptions}
    />
    <DetailItem
      label="Granblue ID"
      bind:value={editData.granblue_id}
      editable={true}
      type="text"
    />
  {:else}
    <DetailItem label="Name (EN)" value={weapon.name?.en || '—'} />
    <DetailItem label="Name (JP)" value={weapon.name?.ja || '—'} />
    <DetailItem label="Rarity" value={getRarityLabel(weapon.rarity)} />
    <DetailItem label="Granblue ID">
      {#if weapon.granblueId}
        <CopyableText value={weapon.granblueId} />
      {:else}
        —
      {/if}
    </DetailItem>
  {/if}
</DetailsContainer>


