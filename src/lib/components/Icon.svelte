
<script lang="ts">
  interface Props {
    name: string;
    size?: number | string;
    width?: number | string;
    height?: number | string;
    color?: string;
    class?: string;
  }

  const {
    name,
    size = 24,
    width: explicitWidth,
    height: explicitHeight,
    color = 'currentColor',
    class: className = ''
  }: Props = $props();

  const resolvedWidth = $derived(explicitWidth ?? size);
  const resolvedHeight = $derived(explicitHeight ?? size);

  let svgContent = $state<string>('');
  let loading = $state(true);

  $effect(() => {
    loadIcon();
  });

  async function loadIcon() {
    try {
      loading = true;
      const iconModule = await import(`../../assets/icons/${name}.svg?raw`);
      let content = iconModule.default;
      
      // Remove width and height from root <svg> only (preserve inner element dimensions)
      content = content.replace(/<svg([^>]*)width="[^"]*"/, '<svg$1');
      content = content.replace(/<svg([^>]*)height="[^"]*"/, '<svg$1');
      
      // Add viewBox if not present (fallback to 0 0 24 24)
      if (!content.includes('viewBox')) {
        content = content.replace('<svg', '<svg viewBox="0 0 24 24"');
      }
      
      svgContent = content;
    } catch (error) {
      if (import.meta.env.DEV) console.error(`Failed to load icon: ${name}`, error);
      svgContent = '';
    } finally {
      loading = false;
    }
  }
</script>

{#if !loading && svgContent}
  <span
    class="icon {className}"
    style="width: {typeof resolvedWidth === 'number' ? `${resolvedWidth}px` : resolvedWidth};
           height: {typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight};
           {color !== 'currentColor' ? `color: ${color};` : ''}
           display: inline-flex;
           align-items: center;
           justify-content: center;"
  >
    {@html svgContent.replace('<svg', `<svg width="100%" height="100%"`)}
  </span>
{/if}

<style>
  .icon {
    line-height: 0;
    flex-shrink: 0;
  }
  
  .icon :global(svg) {
    display: block;
  }
</style>