<script lang="ts">
	import { Tooltip as TooltipBase } from 'bits-ui'
	import type { Snippet } from 'svelte'

	interface TooltipProps {
		content: string
		children: Snippet
		delayDuration?: number
		disableCloseOnTriggerClick?: boolean
		disabled?: boolean
		disableHoverableContent?: boolean
	}

	const {
		content,
		children,
		delayDuration = 200,
		disableCloseOnTriggerClick = false,
		disabled = false,
		disableHoverableContent = false
	}: TooltipProps = $props()
</script>

<TooltipBase.Root
	{delayDuration}
	{disableCloseOnTriggerClick}
	{disabled}
	{disableHoverableContent}
>
	<TooltipBase.Trigger>
		{#snippet child({ props })}
			<span {...props}>
				{@render children()}
			</span>
		{/snippet}
	</TooltipBase.Trigger>
	<TooltipBase.Content class="tooltip-content" sideOffset={8}>
		{content}
	</TooltipBase.Content>
</TooltipBase.Root>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;

	:global(.tooltip-content) {
		background: var(--tooltip-bg, #2a2a2a);
		color: var(--tooltip-text, white);
		padding: $unit-half $unit;
		border-radius: $item-corner-small;
		font-size: $font-small;
		font-weight: $medium;
		z-index: 1000;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
		max-width: calc($unit * 31.25);
		line-height: 1.4;
	}
</style>