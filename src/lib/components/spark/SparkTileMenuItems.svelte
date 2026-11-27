<!-- SparkTileMenuItems - A spark tile's actions, for both its click menu and its right-click menu -->

<script lang="ts">
	import { ContextMenu, DropdownMenu } from 'bits-ui'
	import { m } from '$lib/paraglide/messages'

	interface Props {
		variant: 'context' | 'dropdown'
		sparked: boolean
		onToggleSparked: () => void
		onRemove: () => void
	}

	let { variant, sparked, onToggleSparked, onRemove }: Props = $props()

	const Item = $derived(variant === 'context' ? ContextMenu.Item : DropdownMenu.Item)
	const itemClass = $derived(variant === 'context' ? 'context-menu-item' : 'dropdown-menu-item')
</script>

<Item class={itemClass} onSelect={onToggleSparked}>
	{sparked ? m.spark_unmark_sparked() : m.spark_mark_sparked()}
</Item>
<Item class={itemClass} onSelect={onRemove}>
	{m.spark_remove()}
</Item>
