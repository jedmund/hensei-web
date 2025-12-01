<svelte:options runes={true} />

<script lang="ts">
  import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
  import DetailItem from '$lib/components/ui/DetailItem.svelte'
  import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
  import { getCharacterMaxUncapLevel } from '$lib/utils/uncap'
  import { getElementLabel } from '$lib/utils/element'

  type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

  interface Props {
    character: any
    editMode?: boolean
    editData?: any
  }

  let { character, editMode = false, editData = $bindable() }: Props = $props()

  const uncap = $derived(
    editMode
      ? { flb: editData.flb, ulb: editData.ulb, transcendence: editData.transcendence }
      : (character?.uncap ?? {})
  )
  const flb = $derived(uncap.flb ?? false)
  const ulb = $derived(uncap.ulb ?? false)
  const transcendence = $derived(uncap.transcendence ?? false)
  const special = $derived(editMode ? editData.special : (character?.special ?? false))
  const uncapLevel = $derived(getCharacterMaxUncapLevel({ special, uncap }))
  const transcendenceStage = $derived(transcendence ? 5 : 0)

  // Get element name for checkbox theming
  const elementName = $derived.by((): ElementName | undefined => {
    const el = editMode ? editData.element : character?.element
    const label = getElementLabel(el)
    return label !== '—' && label !== 'Null'
      ? (label.toLowerCase() as ElementName)
      : undefined
  })
</script>

<DetailsContainer title="Uncap">
  {#if character?.uncap || editMode}
    <DetailItem label="Uncap">
      <UncapIndicator
        type="character"
        {uncapLevel}
        {transcendenceStage}
        {flb}
        {ulb}
        {transcendence}
        {special}
        editable={false}
      />
    </DetailItem>
  {/if}

  {#if editMode}
    <DetailItem label="FLB" bind:value={editData.flb} editable={true} type="checkbox" element={elementName} />
    <DetailItem label="ULB" bind:value={editData.ulb} editable={true} type="checkbox" element={elementName} />
    <DetailItem label="Transcendence" bind:value={editData.transcendence} editable={true} type="checkbox" element={elementName} />
    <DetailItem label="Special" bind:value={editData.special} editable={true} type="checkbox" element={elementName} />
  {/if}
</DetailsContainer>

