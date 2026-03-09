<script lang="ts">
  import { getGuidebookImage } from '$lib/utils/images'

  interface Props {
    item: Record<string, any> | undefined
    position: number // 1..3
  }

  let { item, position }: Props = $props()

  function displayName(input: Record<string, any> | undefined): string {
    if (!input) return '—'
    const maybe = input.name ?? input
    if (typeof maybe === 'string') return maybe
    if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
    return '—'
  }

  function guidebookImageUrl(g?: Record<string, any>): string {
    return getGuidebookImage(g?.granblueId)
  }
</script>

<div class="unit">
  <img class="image" alt={item ? displayName(item) : ''} src={guidebookImageUrl(item)} />
  <div class="name">{item ? displayName(item) : '—'}</div>
</div>

<style lang="scss">
  @use '$src/themes/colors' as *;
  @use '$src/themes/typography' as *;
  @use '$src/themes/spacing' as *;
  @use '$src/themes/layout' as layout;

  .unit { position: relative; width: 100%; display: flex; flex-direction: column; align-items: center; gap: $unit; }
  .image { width: 100%; height: auto; border: 1px solid $grey-75; border-radius: layout.$input-corner; display: block; background: var(--extra-purple-card-bg); }
  .name { font-size: $font-small; text-align: center; color: var(--text-secondary); }
</style>
