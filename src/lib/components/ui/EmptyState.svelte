<script lang="ts">
	import type { Snippet } from 'svelte'
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		/** Optional icon name from the icon set. Renders above the message. */
		icon?: string
		iconSize?: number
		message: string
		/** Optional content (e.g. action button) rendered beneath the message. */
		children?: Snippet
	}

	let { icon, iconSize = 20, message, children }: Props = $props()
</script>

<div class="empty-state" role="status">
	{#if icon}
		<Icon name={icon} size={iconSize} />
	{/if}
	<p>{message}</p>
	{@render children?.()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		min-height: 320px;
		text-align: center;
		color: var(--text-secondary);

		p {
			margin: 0;
			font-size: $font-regular;
		}
	}
</style>
