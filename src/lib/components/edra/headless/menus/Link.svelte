<script lang="ts">
	import type { ShouldShowProps } from '../../types.js'
	import BubbleMenu from '../../components/BubbleMenu.svelte'
	import type { Editor } from '@tiptap/core'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'
	import ExternalLink from '@lucide/svelte/icons/external-link'
	import Copy from '@lucide/svelte/icons/copy'
	import Trash from '@lucide/svelte/icons/trash'

	interface Props {
		editor: Editor
	}

	const { editor }: Props = $props()

	let link = $derived.by(() => editor.getAttributes('link').href)
</script>

<BubbleMenu
	{editor}
	pluginKey="link-bubble-menu"
	shouldShow={(props: ShouldShowProps) => {
		if (!props.editor.isEditable) return false
		return props.editor.isActive('link')
	}}
>
	<Button
		variant="ghost"
		size="small"
		onclick={() => window.open(link, '_blank', 'noopener,noreferrer')}
	>
		{#snippet leftAccessory()}<ExternalLink size={14} />{/snippet}
		{m.editor_visit_link()}
	</Button>
	<Button
		variant="ghost"
		size="small"
		onclick={() => {
			navigator.clipboard.writeText(link)
		}}
	>
		{#snippet leftAccessory()}<Copy size={14} />{/snippet}
		{m.editor_copy_link()}
	</Button>
	<Button
		variant="ghost"
		size="small"
		onclick={() => editor.chain().focus().extendMarkRange('link').unsetLink().run()}
	>
		{#snippet leftAccessory()}<Trash size={14} />{/snippet}
		{m.editor_remove_link()}
	</Button>
</BubbleMenu>
