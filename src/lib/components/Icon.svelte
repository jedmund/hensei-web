<script lang="ts" module>
	// Bundled eagerly so icons are in the server-rendered HTML instead of
	// popping in after hydration (~40 KB raw for the whole set)
	const files = import.meta.glob<string>('../../assets/icons/*.svg', {
		query: '?raw',
		import: 'default',
		eager: true
	})

	function normalize(content: string): string {
		// Remove width and height from root <svg> only (preserve inner element dimensions)
		content = content.replace(/<svg([^>]*)width="[^"]*"/, '<svg$1')
		content = content.replace(/<svg([^>]*)height="[^"]*"/, '<svg$1')

		// Add viewBox if not present (fallback to 0 0 24 24)
		if (!content.includes('viewBox')) {
			content = content.replace('<svg', '<svg viewBox="0 0 24 24"')
		}

		return content
	}

	const icons: Record<string, string> = Object.fromEntries(
		Object.entries(files).map(([path, content]) => [
			path.slice(path.lastIndexOf('/') + 1, -'.svg'.length),
			normalize(content)
		])
	)

	function iconSvg(name: string): string {
		const content = icons[name]
		if (content === undefined) {
			if (import.meta.env.DEV) console.error(`Failed to load icon: ${name}`)
			return ''
		}
		return content
	}
</script>

<script lang="ts">
	interface Props {
		name: string
		size?: number | string
		width?: number | string
		height?: number | string
		color?: string
		class?: string
	}

	const {
		name,
		size = 24,
		width: explicitWidth,
		height: explicitHeight,
		color = 'currentColor',
		class: className = ''
	}: Props = $props()

	const resolvedWidth = $derived(explicitWidth ?? size)
	const resolvedHeight = $derived(explicitHeight ?? size)

	const svgContent = $derived(iconSvg(name))
</script>

{#if svgContent}
	<span
		class="icon {className}"
		style="width: {typeof resolvedWidth === 'number' ? `${resolvedWidth}px` : resolvedWidth};
           height: {typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight};
           {color !== 'currentColor' ? `color: ${color};` : ''}
           display: inline-flex;
           align-items: center;
           justify-content: center;"
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
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
