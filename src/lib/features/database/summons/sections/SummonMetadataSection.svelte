<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import CopyableText from '$lib/components/ui/CopyableText.svelte'
  import { getRarityLabel, getRarityOptions } from '$lib/utils/rarity'

  interface Props {
    summon: any
    editMode?: boolean
    editData?: any
  }

  let {
    summon,
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
    <DetailItem
      label="Summon ID"
      sublabel="Internal game identifier (if known)"
      bind:value={editData.summonId}
      editable={true}
      type="text"
      placeholder="Optional"
    />
  {:else}
    <DetailItem label="Name (EN)" value={summon.name?.en || '—'} />
    <DetailItem label="Name (JP)" value={summon.name?.ja || '—'} />
    <DetailItem label="Rarity" value={getRarityLabel(summon.rarity)} />
    <DetailItem label="Granblue ID">
      {#if summon.granblueId}
        <CopyableText value={summon.granblueId} />
      {:else}
        —
      {/if}
    </DetailItem>
  {/if}
</DetailsContainer>

