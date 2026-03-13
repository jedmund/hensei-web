<script lang="ts">
	import { ContextMenu, DropdownMenu } from 'bits-ui'

	interface MenuItemsProps {
		onEdit?: (() => void) | undefined
		onViewDetails?: (() => void) | undefined
		onViewInDatabase?: (() => void) | undefined
		onReplace?: (() => void) | undefined
		onDuplicate?: (() => void) | undefined
		onRemove?: (() => void | Promise<void>) | undefined
		canEdit?: boolean | undefined
		variant?: 'context' | 'dropdown'
		editLabel?: string | undefined
		viewDetailsLabel?: string | undefined
		viewInDatabaseLabel?: string | undefined
		replaceLabel?: string | undefined
		duplicateLabel?: string | undefined
		duplicateDisabled?: boolean | undefined
		removeLabel?: string | undefined
	}

	let {
		onEdit,
		onViewDetails,
		onViewInDatabase,
		onReplace,
		onDuplicate,
		onRemove,
		canEdit = false,
		variant = 'context',
		editLabel = 'Edit',
		viewDetailsLabel = 'View details',
		viewInDatabaseLabel = 'View in Database',
		replaceLabel = 'Replace',
		duplicateLabel = 'Duplicate',
		duplicateDisabled = false,
		removeLabel = 'Remove from team'
	}: MenuItemsProps = $props()

	// Select the appropriate component based on variant
	const Item = variant === 'context' ? ContextMenu.Item : DropdownMenu.Item
	const Separator = variant === 'context' ? ContextMenu.Separator : DropdownMenu.Separator
	const itemClass = variant === 'context' ? 'context-menu-item' : 'dropdown-menu-item'
	const separatorClass = variant === 'context' ? 'context-menu-separator' : 'dropdown-menu-separator'

	// Track whether we've rendered any items above the details/database section (for separator logic)
	const hasEditSection = canEdit && (onEdit || onReplace || onDuplicate)
</script>

{#if canEdit && onEdit}
	<Item class={itemClass} onclick={onEdit}>
		{editLabel}
	</Item>
{/if}

{#if canEdit && onReplace}
	<Item class={itemClass} onclick={onReplace}>
		{replaceLabel}
	</Item>
{/if}

{#if canEdit && onDuplicate}
	<Item class={itemClass} onclick={onDuplicate} disabled={duplicateDisabled}>
		{duplicateLabel}
	</Item>
{/if}

{#if hasEditSection && (onViewDetails || onViewInDatabase)}
	<Separator class={separatorClass} />
{/if}

{#if onViewDetails}
	<Item class={itemClass} onclick={onViewDetails}>
		{viewDetailsLabel}
	</Item>
{/if}

{#if onViewInDatabase}
	<Item class={itemClass} onclick={onViewInDatabase}>
		{viewInDatabaseLabel}
	</Item>
{/if}

{#if canEdit && onRemove}
	<Separator class={separatorClass} />
	<Item class="{itemClass} danger" onclick={onRemove}>
		{removeLabel}
	</Item>
{/if}
