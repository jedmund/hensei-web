<svelte:options runes={true} />

<script lang="ts">
  import DetailsHeader from '$lib/components/ui/DetailsHeader.svelte'
  import type { Snippet } from 'svelte'

  interface Props {
    type: 'character' | 'summon' | 'weapon'
    item: any
    image: string
    showEdit?: boolean
    editMode?: boolean
    isSaving?: boolean
    saveSuccess?: boolean
    saveError?: string | null
    onEdit?: () => void
    onSave?: () => void
    onCancel?: () => void
  }

  let {
    type,
    item,
    image,
    showEdit = false,
    editMode = false,
    isSaving = false,
    saveSuccess = false,
    saveError = null,
    onEdit,
    onSave,
    onCancel,
    children
  }: Props & { children: Snippet } = $props()
</script>

<div class="content">
  <DetailsHeader
    {type}
    {item}
    {image}
    {editMode}
    showEdit={showEdit}
    onEdit={onEdit}
    onSave={onSave}
    onCancel={onCancel}
    {isSaving}
  />

  {#if saveSuccess || saveError}
    <div class="edit-controls">
      {#if saveSuccess}
        <span class="success-message">Changes saved successfully!</span>
      {/if}
      {#if saveError}
        <span class="error-message">{saveError}</span>
      {/if}
    </div>
  {/if}

  {@render children?.()}
</div>

<style lang="scss">
  @use '$src/themes/colors' as colors;
  @use '$src/themes/layout' as layout;
  @use '$src/themes/spacing' as spacing;
  @use '$src/themes/typography' as typography;
  @use '$src/themes/effects' as effects;

  .content {
    background: white;
    border-radius: layout.$card-corner;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: visible;
    margin-top: spacing.$unit-2x;
    position: relative;
  }

  .edit-controls {
    padding: spacing.$unit-2x;
    border-bottom: 1px solid colors.$grey-80;
    display: flex;
    gap: spacing.$unit;
    align-items: center;

    .success-message {
      color: colors.$grey-30;
      font-size: typography.$font-small;
      animation: fadeIn effects.$duration-opacity-fade ease-in;
    }

    .error-message {
      color: colors.$error;
      font-size: typography.$font-small;
      animation: fadeIn effects.$duration-opacity-fade ease-in;
    }
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>
