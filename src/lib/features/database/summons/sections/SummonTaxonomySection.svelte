<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import { getElementLabel, getElementOptions } from '$lib/utils/element'

  let { summon, editMode = false, editData = $bindable<any>() }:
    { summon: any; editMode?: boolean; editData?: any } = $props()

  const elementOptions = getElementOptions()
</script>

<DetailsContainer title="Details">
  {#if editMode}
    <DetailItem label="Element" bind:value={editData.element} editable={true} type="select" options={elementOptions} />
  {:else}
    <DetailItem label="Element" value={getElementLabel(summon.element)} />
  {/if}
</DetailsContainer>

