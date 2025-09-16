<script lang="ts">
	import { ContextMenu as ContextMenuBase } from 'bits-ui'
	import type { Snippet } from 'svelte'

	interface ContextMenuProps {
		children: Snippet
		menu: Snippet
	}

	let { children, menu }: ContextMenuProps = $props()
</script>

<ContextMenuBase.Root>
	<ContextMenuBase.Trigger>
		{#snippet child({ props })}
			<div {...props}>
				{@render children()}
			</div>
		{/snippet}
	</ContextMenuBase.Trigger>

	<ContextMenuBase.Portal>
		<ContextMenuBase.Content class="context-menu">
			{@render menu()}
		</ContextMenuBase.Content>
	</ContextMenuBase.Portal>
</ContextMenuBase.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	:global(.context-menu) {
		background: var(--app-bg, white);
		border: 1px solid var(--border-color, #ddd);
		border-radius: $card-corner;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		padding: $unit-half;
		min-width: 180px;
		z-index: 200;
		animation: slideIn 0.15s ease-out;
	}

	:global(.context-menu-item) {
		padding: $unit-half $unit;
		border-radius: $item-corner-small;
		cursor: pointer;
		font-size: $font-regular;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: $unit;
		transition: background 0.2s;

		&:hover {
			background: var(--button-contained-bg-hover, #f5f5f5);
		}

		&.danger {
			color: var(--danger, #dc3545);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	:global(.context-menu-separator) {
		height: 1px;
		background: var(--border-color, #ddd);
		margin: $unit-half 0;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-2px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
