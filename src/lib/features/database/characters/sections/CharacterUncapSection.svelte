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

  // Auto-check/uncheck uncap levels in hierarchy: Transcendence > ULB > FLB
  function handleFlbChange(checked: boolean) {
    if (!checked) {
      // Unchecking FLB should also uncheck ULB and Transcendence
      editData.ulb = false
      editData.transcendence = false
    }
  }

  function handleUlbChange(checked: boolean) {
    if (checked && !editData.flb) {
      // Checking ULB should also check FLB
      editData.flb = true
    } else if (!checked) {
      // Unchecking ULB should also uncheck Transcendence
      editData.transcendence = false
    }
  }

  function handleTranscendenceChange(checked: boolean) {
    if (checked) {
      // Checking Transcendence should also check ULB and FLB
      if (!editData.ulb) editData.ulb = true
      if (!editData.flb) editData.flb = true
    }
  }

  function handleSpecialChange(checked: boolean) {
    if (checked) {
      // Special characters (Story SRs) don't have standard uncap levels
      editData.flb = false
      editData.ulb = false
      editData.transcendence = false
    }
  }
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
    <DetailItem label="FLB" bind:value={editData.flb} editable={true} type="checkbox" element={elementName} onchange={handleFlbChange} />
    <DetailItem label="ULB" bind:value={editData.ulb} editable={true} type="checkbox" element={elementName} onchange={handleUlbChange} />
    <DetailItem label="Transcendence" bind:value={editData.transcendence} editable={true} type="checkbox" element={elementName} onchange={handleTranscendenceChange} />
    <div class="special-field">
      <DetailItem label="Special" bind:value={editData.special} editable={true} type="checkbox" element={elementName} onchange={handleSpecialChange} />
      <p class="special-note">This is for Story SRs. Don't check this unless something really weird happens.</p>
    </div>
  {/if}
</DetailsContainer>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;

  .special-field {
    display: flex;
    flex-direction: column;
  }

  .special-note {
    font-size: typography.$font-small;
    color: colors.$grey-50;
    margin: 0;
    padding: 0 spacing.$unit spacing.$unit;
  }
</style>

