<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		active?: boolean
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
		onclick?: () => void
		'aria-label'?: string
		'aria-pressed'?: boolean
		children: import('svelte').Snippet
	}

	const { active = false, element, children, ...restProps }: Props = $props()
</script>

<Button
	variant="ghost"
	size="small"
	shape="pill"
	{active}
	class={active && element ? `element-active ${element}` : undefined}
	{...restProps}
>
	{@render children()}
</Button>

<style lang="scss">
	:global([data-button-root].element-active.wind) {
		background: var(--wind-nav-selected-bg);
		color: var(--wind-nav-selected-text);
	}
	:global([data-button-root].element-active.fire) {
		background: var(--fire-nav-selected-bg);
		color: var(--fire-nav-selected-text);
	}
	:global([data-button-root].element-active.water) {
		background: var(--water-nav-selected-bg);
		color: var(--water-nav-selected-text);
	}
	:global([data-button-root].element-active.earth) {
		background: var(--earth-nav-selected-bg);
		color: var(--earth-nav-selected-text);
	}
	:global([data-button-root].element-active.dark) {
		background: var(--dark-nav-selected-bg);
		color: var(--dark-nav-selected-text);
	}
	:global([data-button-root].element-active.light) {
		background: var(--light-nav-selected-bg);
		color: var(--light-nav-selected-text);
	}
</style>
