<svelte:options runes={true} />

<script lang="ts">
  import type { CharacterSuggestions } from '$lib/api/adapters/entity.adapter'
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import SuggestionDetailItem from '$lib/components/ui/SuggestionDetailItem.svelte'

  interface Props {
    character: any
    editMode?: boolean
    editData?: any
    // Suggestion support for batch import
    suggestions?: CharacterSuggestions
    dismissedSuggestions?: Set<string>
    onAcceptSuggestion?: (field: string, value: any) => void
    onDismissSuggestion?: (field: string) => void
  }

  let {
    character,
    editMode = false,
    editData = $bindable(),
    suggestions,
    dismissedSuggestions,
    onAcceptSuggestion,
    onDismissSuggestion
  }: Props = $props()

  const flb = $derived(editMode ? Boolean(editData.flb) : Boolean(character?.uncap?.flb))
  const ulb = $derived(editMode ? Boolean(editData.ulb) : Boolean(character?.uncap?.ulb))
</script>

<DetailsContainer title="HP Stats">
  {#if editMode}
    <SuggestionDetailItem
      label="Base HP"
      bind:value={editData.minHp}
      editable={true}
      type="number"
      placeholder="0"
      suggestion={suggestions?.minHp}
      dismissedSuggestion={dismissedSuggestions?.has('minHp')}
      onAcceptSuggestion={() => onAcceptSuggestion?.('minHp', suggestions?.minHp)}
      onDismissSuggestion={() => onDismissSuggestion?.('minHp')}
    />
    <SuggestionDetailItem
      label="Max HP"
      bind:value={editData.maxHp}
      editable={true}
      type="number"
      placeholder="0"
      suggestion={suggestions?.maxHp}
      dismissedSuggestion={dismissedSuggestions?.has('maxHp')}
      onAcceptSuggestion={() => onAcceptSuggestion?.('maxHp', suggestions?.maxHp)}
      onDismissSuggestion={() => onDismissSuggestion?.('maxHp')}
    />
    {#if flb}
      <SuggestionDetailItem
        label="Max HP (FLB)"
        bind:value={editData.maxHpFlb}
        editable={true}
        type="number"
        placeholder="0"
        suggestion={suggestions?.maxHpFlb}
        dismissedSuggestion={dismissedSuggestions?.has('maxHpFlb')}
        onAcceptSuggestion={() => onAcceptSuggestion?.('maxHpFlb', suggestions?.maxHpFlb)}
        onDismissSuggestion={() => onDismissSuggestion?.('maxHpFlb')}
      />
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
    <SuggestionDetailItem
      label="Base Attack"
      bind:value={editData.minAtk}
      editable={true}
      type="number"
      placeholder="0"
      suggestion={suggestions?.minAtk}
      dismissedSuggestion={dismissedSuggestions?.has('minAtk')}
      onAcceptSuggestion={() => onAcceptSuggestion?.('minAtk', suggestions?.minAtk)}
      onDismissSuggestion={() => onDismissSuggestion?.('minAtk')}
    />
    <SuggestionDetailItem
      label="Max Attack"
      bind:value={editData.maxAtk}
      editable={true}
      type="number"
      placeholder="0"
      suggestion={suggestions?.maxAtk}
      dismissedSuggestion={dismissedSuggestions?.has('maxAtk')}
      onAcceptSuggestion={() => onAcceptSuggestion?.('maxAtk', suggestions?.maxAtk)}
      onDismissSuggestion={() => onDismissSuggestion?.('maxAtk')}
    />
    {#if flb}
      <SuggestionDetailItem
        label="Max Attack (FLB)"
        bind:value={editData.maxAtkFlb}
        editable={true}
        type="number"
        placeholder="0"
        suggestion={suggestions?.maxAtkFlb}
        dismissedSuggestion={dismissedSuggestions?.has('maxAtkFlb')}
        onAcceptSuggestion={() => onAcceptSuggestion?.('maxAtkFlb', suggestions?.maxAtkFlb)}
        onDismissSuggestion={() => onDismissSuggestion?.('maxAtkFlb')}
      />
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
    <DetailItem label="Base DA" value={character.baseDa} />
    <DetailItem label="Base TA" value={character.baseTa} />
    <DetailItem label="Ougi Ratio" value={character.ougiRatio?.ougiRatio} />
    {#if flb}
      <DetailItem label="Ougi Ratio (FLB)" value={character.ougiRatio?.ougiRatioFlb} />
    {/if}
  {/if}
</DetailsContainer>

