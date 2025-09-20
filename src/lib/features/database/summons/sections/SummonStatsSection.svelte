<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'

  let { summon, editMode = false, editData = $bindable<any>() }:
    { summon: any; editMode?: boolean; editData?: any } = $props()

  const flb = $derived(editMode ? Boolean(editData.flb) : Boolean(summon?.uncap?.flb))
</script>

<DetailsContainer title="HP Stats">
  {#if editMode}
    <DetailItem label="Base HP" bind:value={editData.min_hp} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max HP" bind:value={editData.max_hp} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max HP (FLB)" bind:value={editData.max_hp_flb} editable={true} type="number" placeholder="0" />
  {:else}
    <DetailItem label="Base HP" value={summon.hp?.min_hp} />
    <DetailItem label="Max HP" value={summon.hp?.max_hp} />
    {#if flb}
      <DetailItem label="Max HP (FLB)" value={summon.hp?.max_hp_flb} />
    {/if}
  {/if}
</DetailsContainer>

<DetailsContainer title="Attack Stats">
  {#if editMode}
    <DetailItem label="Base Attack" bind:value={editData.min_atk} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max Attack" bind:value={editData.max_atk} editable={true} type="number" placeholder="0" />
    <DetailItem label="Max Attack (FLB)" bind:value={editData.max_atk_flb} editable={true} type="number" placeholder="0" />
  {:else}
    <DetailItem label="Base Attack" value={summon.atk?.min_atk} />
    <DetailItem label="Max Attack" value={summon.atk?.max_atk} />
    {#if flb}
      <DetailItem label="Max Attack (FLB)" value={summon.atk?.max_atk_flb} />
    {/if}
  {/if}
</DetailsContainer>

