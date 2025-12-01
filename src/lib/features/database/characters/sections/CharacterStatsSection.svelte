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
</script>

<DetailsContainer title="HP Stats">
  {#if editMode}
    <DetailItem label="Base HP" bind:value={editData.minHp} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max HP" bind:value={editData.maxHp} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max HP (FLB)" bind:value={editData.maxHpFlb} editable={true} type="number" placeholder="0" />
  {:else}
    <DetailItem label="Base HP" value={character.hp?.minHp} />
    <DetailItem label="Max HP" value={character.hp?.maxHp} />
    {#if flb}
      <DetailItem label="Max HP (FLB)" value={character.hp?.maxHpFlb} />
    {/if}
  {/if}
</DetailsContainer>

<DetailsContainer title="Attack Stats">
  {#if editMode}
    <DetailItem label="Base Attack" bind:value={editData.minAtk} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max Attack" bind:value={editData.maxAtk} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max Attack (FLB)" bind:value={editData.maxAtkFlb} editable={true} type="number" placeholder="0" />
  {:else}
    <DetailItem label="Base Attack" value={character.atk?.minAtk} />
    <DetailItem label="Max Attack" value={character.atk?.maxAtk} />
    {#if flb}
      <DetailItem label="Max Attack (FLB)" value={character.atk?.maxAtkFlb} />
    {/if}
  {/if}
</DetailsContainer>

