<script lang="ts">
	import { ContextMenu, DropdownMenu } from 'bits-ui'

	interface MenuItemsProps {
		onViewDetails?: (() => void) | undefined
		onReplace?: (() => void) | undefined
		onRemove?: (() => void | Promise<void>) | undefined
		canEdit?: boolean | undefined
		variant?: 'context' | 'dropdown'
		viewDetailsLabel?: string | undefined
		replaceLabel?: string | undefined
		removeLabel?: string | undefined
	}

	let {
		onViewDetails,
		onReplace,
		onRemove,
		canEdit = false,
		variant = 'context',
		viewDetailsLabel = 'View Details',
		replaceLabel = 'Replace',
		removeLabel = 'Remove'
	}: MenuItemsProps = $props()

	// Select the appropriate component based on variant
	const Item = variant === 'context' ? ContextMenu.Item : DropdownMenu.Item
	const Separator = variant === 'context' ? ContextMenu.Separator : DropdownMenu.Separator
	const itemClass = variant === 'context' ? 'context-menu-item' : 'dropdown-menu-item'
	const separatorClass = variant === 'context' ? 'context-menu-separator' : 'dropdown-menu-separator'
</script>

{#if onViewDetails}
	<Item class={itemClass} onclick={onViewDetails}>
		{viewDetailsLabel}
	</Item>
{/if}

{#if canEdit}
	{#if onReplace}
		<Item class={itemClass} onclick={onReplace}>
			{replaceLabel}
		</Item>
	{/if}

	{#if onRemove}
		<Separator class={separatorClass} />
		<Item class="{itemClass} danger" onclick={onRemove}>
			{removeLabel}
		</Item>
	{/if}
{/if}
