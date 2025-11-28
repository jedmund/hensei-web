<script lang="ts">
	import { ContextMenu } from 'bits-ui'
	import type { Snippet } from 'svelte'

	interface ContextMenuWrapperProps {
		trigger: Snippet
		menu: Snippet
		open?: boolean
	}

	let { trigger, menu, open = $bindable(false) }: ContextMenuWrapperProps = $props()
</script>

<ContextMenu.Root bind:open>
	<ContextMenu.Trigger>
		{#snippet child({ props })}
			<div class="context-trigger" {...props}>
				{@render trigger()}
			</div>
		{/snippet}
	</ContextMenu.Trigger>

	<ContextMenu.Portal>
		<ContextMenu.Content class="context-menu">
			{@render menu()}
		</ContextMenu.Content>
	</ContextMenu.Portal>
</ContextMenu.Root>

<style lang="scss">
	@use './menu-styles.scss';

	.context-trigger {
		display: block;
	}
</style>
