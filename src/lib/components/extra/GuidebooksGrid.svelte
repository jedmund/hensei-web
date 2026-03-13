<script lang="ts">
  import GuidebookUnit from '$lib/components/extra/GuidebookUnit.svelte'
  import ExtraContainerItem from './ExtraContainerItem.svelte'
  import type { GuidebookList } from '$lib/types/api/party'
  import * as m from '$lib/paraglide/messages'

  interface Props {
    guidebooks?: GuidebookList
    canEdit?: boolean
    onClickSlot?: (position: number) => void
    onRemove?: (position: number) => void
  }

  let { guidebooks, canEdit = false, onClickSlot, onRemove }: Props = $props()
</script>

<ExtraContainerItem title={m.guidebooks()}>
  <ul class="grid">
    {#each [1, 2, 3] as pos (pos)}
      <li>
        <GuidebookUnit
          item={guidebooks?.[pos as 1 | 2 | 3]}
          position={pos}
          {canEdit}
          onclick={() => onClickSlot?.(pos)}
          onRemove={() => onRemove?.(pos)}
        />
      </li>
    {/each}
  </ul>
</ExtraContainerItem>

<style lang="scss">
  @use '$src/themes/spacing' as *;
  @use '$src/themes/mixins' as *;

  .grid {
    display: grid;
    gap: $unit-3x;
    grid-template-columns: repeat(3, minmax(0, 1fr));

    @include breakpoint(tablet) { gap: $unit-2x; }
    @include breakpoint(phone) { gap: $unit; }

    & > li { list-style: none; }
  }
</style>
