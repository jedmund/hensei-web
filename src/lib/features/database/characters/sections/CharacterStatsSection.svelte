<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'

  interface Props {
    character: any
    editMode?: boolean
    editData?: any
  }

  let { character, editMode = false, editData = $bindable() }: Props = $props()

  const flb = $derived(editMode ? Boolean(editData.flb) : Boolean(character?.uncap?.flb))
  const ulb = $derived(editMode ? Boolean(editData.ulb) : Boolean(character?.uncap?.ulb))
</script>

<DetailsContainer title="HP Stats">
  {#if editMode}
    <DetailItem label="Base HP" bind:value={editData.minHp} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max HP" bind:value={editData.maxHp} editable={true} type="number" placeholder="0" />
    {#if flb}
      <DetailItem label="Max HP (FLB)" bind:value={editData.maxHpFlb} editable={true} type="number" placeholder="0" />
    {/if}
    {#if ulb}
      <DetailItem label="Max HP (ULB)" bind:value={editData.maxHpUlb} editable={true} type="number" placeholder="0" />
    {/if}
  {:else}
    <DetailItem label="Base HP" value={character.hp?.minHp} />
    <DetailItem label="Max HP" value={character.hp?.maxHp} />
    {#if flb}
      <DetailItem label="Max HP (FLB)" value={character.hp?.maxHpFlb} />
    {/if}
    {#if ulb}
      <DetailItem label="Max HP (ULB)" value={character.hp?.maxHpUlb} />
    {/if}
  {/if}
</DetailsContainer>

<DetailsContainer title="Attack Stats">
  {#if editMode}
    <DetailItem label="Base Attack" bind:value={editData.minAtk} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max Attack" bind:value={editData.maxAtk} editable={true} type="number" placeholder="0" />
    {#if flb}
      <DetailItem label="Max Attack (FLB)" bind:value={editData.maxAtkFlb} editable={true} type="number" placeholder="0" />
    {/if}
    {#if ulb}
      <DetailItem label="Max Attack (ULB)" bind:value={editData.maxAtkUlb} editable={true} type="number" placeholder="0" />
    {/if}
  {:else}
    <DetailItem label="Base Attack" value={character.atk?.minAtk} />
    <DetailItem label="Max Attack" value={character.atk?.maxAtk} />
    {#if flb}
      <DetailItem label="Max Attack (FLB)" value={character.atk?.maxAtkFlb} />
    {/if}
    {#if ulb}
      <DetailItem label="Max Attack (ULB)" value={character.atk?.maxAtkUlb} />
    {/if}
  {/if}
</DetailsContainer>

<DetailsContainer title="Other Stats">
  {#if editMode}
    <DetailItem label="Base DA" bind:value={editData.baseDa} editable={true} type="number" placeholder="0" />
    <DetailItem label="Base TA" bind:value={editData.baseTa} editable={true} type="number" placeholder="0" />
    <DetailItem label="Ougi Ratio" bind:value={editData.ougiRatio} editable={true} type="number" placeholder="0" />
    {#if flb}
      <DetailItem label="Ougi Ratio (FLB)" bind:value={editData.ougiRatioFlb} editable={true} type="number" placeholder="0" />
    {/if}
  {:else}
    {#if character.baseDa}
      <DetailItem label="Base DA" value={character.baseDa} />
    {/if}
    {#if character.baseTa}
      <DetailItem label="Base TA" value={character.baseTa} />
    {/if}
    {#if character.ougiRatio}
      <DetailItem label="Ougi Ratio" value={character.ougiRatio} />
    {/if}
    {#if character.ougiRatioFlb}
      <DetailItem label="Ougi Ratio (FLB)" value={character.ougiRatioFlb} />
    {/if}
  {/if}
</DetailsContainer>

