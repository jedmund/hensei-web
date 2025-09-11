<script lang="ts">
  interface Props {
    name: string;
    size?: number | string;
    color?: string;
    class?: string;
  }

  const { 
    name, 
    size = 24, 
    color = 'currentColor',
    class: className = ''
  }: Props = $props();

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
      
      // Remove width and height attributes to make it responsive
      content = content.replace(/width="[^"]*"/g, '');
      content = content.replace(/height="[^"]*"/g, '');
      
      // Add viewBox if not present (fallback to 0 0 24 24)
      if (!content.includes('viewBox')) {
        content = content.replace('<svg', '<svg viewBox="0 0 24 24"');
      }
      
      svgContent = content;
    } catch (error) {
      console.error(`Failed to load icon: ${name}`, error);
      svgContent = '';
    } finally {
      loading = false;
    }
  }
</script>

{#if !loading && svgContent}
  <span 
    class="icon {className}"
    style="width: {typeof size === 'number' ? `${size}px` : size}; 
           height: {typeof size === 'number' ? `${size}px` : size};
           color: {color};
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