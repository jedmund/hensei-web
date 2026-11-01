<script lang="ts">
	/**
	 * Formatting toolbar for the party description editor: text style
	 * dropdown, bold / italic / underline / strikethrough, link and lists.
	 */
	import * as m from '$lib/paraglide/messages'
	import type { Editor } from '@tiptap/core'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import LinkDialog from '$lib/components/edra/LinkDialog.svelte'
	import { linkDialogState } from '$lib/stores/linkDialog.svelte'
	import { textStyleLabel } from '$lib/utils/descriptionContent'

	// Lucide icons
	import Heading1 from '@lucide/svelte/icons/heading-1'
	import Heading2 from '@lucide/svelte/icons/heading-2'
	import Heading3 from '@lucide/svelte/icons/heading-3'
	import Pilcrow from '@lucide/svelte/icons/pilcrow'
	import Bold from '@lucide/svelte/icons/bold'
	import Italic from '@lucide/svelte/icons/italic'
	import Underline from '@lucide/svelte/icons/underline'
	import StrikeThrough from '@lucide/svelte/icons/strikethrough'
	import LinkIcon from '@lucide/svelte/icons/link-2'
	import List from '@lucide/svelte/icons/list'
	import ListOrdered from '@lucide/svelte/icons/list-ordered'
	import ChevronDown from '@lucide/svelte/icons/chevron-down'

	interface Props {
		editor?: Editor
		/** Bumped by the owner on every editor update or selection change */
		version: number
		/** Called after a style change so the owner can bump `version` */
		onChange: () => void
	}

	let { editor, version, onChange }: Props = $props()

	// Derived label - must use $derived.by() for reactivity in Svelte 5
	// Function calls in templates don't create reactive tracking
	const styleLabel = $derived.by(() => {
		void version // Force re-evaluation when version changes
		return textStyleLabel((name, attrs) => editor?.isActive(name, attrs) ?? false)
	})

	function setHeading(level: 1 | 2 | 3) {
		// Defer to let dropdown close and focus settle
		requestAnimationFrame(() => {
			editor?.chain().focus().toggleHeading({ level }).run()
			onChange()
		})
	}

	function setParagraph() {
		requestAnimationFrame(() => {
			editor?.chain().focus().setParagraph().run()
			onChange()
		})
	}

	function toggleLink() {
		if (editor?.isActive('link')) {
			editor?.chain().focus().unsetLink().run()
		} else if (editor) {
			linkDialogState.show(editor)
		}
	}
</script>

<div class="description-toolbar">
	<!-- Text Style Dropdown -->
	<DropdownMenu>
		{#snippet trigger({ props })}
			<button class="toolbar-button style-trigger" disabled={!editor} {...props}>
				<span>{styleLabel}</span>
				<ChevronDown size={12} />
			</button>
		{/snippet}
		{#snippet menu()}
			<DropdownMenuBase.Item
				class="dropdown-menu-item {editor?.isActive('heading', { level: 1 }) ? 'active' : ''}"
				onSelect={() => setHeading(1)}
			>
				<Heading1 size={16} />
				<span>{m.editor_heading_1()}</span>
			</DropdownMenuBase.Item>
			<DropdownMenuBase.Item
				class="dropdown-menu-item {editor?.isActive('heading', { level: 2 }) ? 'active' : ''}"
				onSelect={() => setHeading(2)}
			>
				<Heading2 size={16} />
				<span>{m.editor_heading_2()}</span>
			</DropdownMenuBase.Item>
			<DropdownMenuBase.Item
				class="dropdown-menu-item {editor?.isActive('heading', { level: 3 }) ? 'active' : ''}"
				onSelect={() => setHeading(3)}
			>
				<Heading3 size={16} />
				<span>{m.editor_heading_3()}</span>
			</DropdownMenuBase.Item>
			<DropdownMenuBase.Item
				class="dropdown-menu-item {editor?.isActive('paragraph') ? 'active' : ''}"
				onSelect={setParagraph}
			>
				<Pilcrow size={16} />
				<span>{m.editor_paragraph()}</span>
			</DropdownMenuBase.Item>
		{/snippet}
	</DropdownMenu>

	<div class="separator"></div>

	<!-- Text Formatting -->
	<button
		class="toolbar-button"
		class:active={editor?.isActive('bold')}
		onclick={() => editor?.chain().focus().toggleBold().run()}
		disabled={!editor}
		title={m.toolbar_bold()}
	>
		<Bold size={16} />
	</button>

	<button
		class="toolbar-button"
		class:active={editor?.isActive('italic')}
		onclick={() => editor?.chain().focus().toggleItalic().run()}
		disabled={!editor}
		title={m.toolbar_italic()}
	>
		<Italic size={16} />
	</button>

	<button
		class="toolbar-button"
		class:active={editor?.isActive('underline')}
		onclick={() => editor?.chain().focus().toggleUnderline().run()}
		disabled={!editor}
		title={m.toolbar_underline()}
	>
		<Underline size={16} />
	</button>

	<button
		class="toolbar-button"
		class:active={editor?.isActive('strike')}
		onclick={() => editor?.chain().focus().toggleStrike().run()}
		disabled={!editor}
		title={m.toolbar_strikethrough()}
	>
		<StrikeThrough size={16} />
	</button>

	<div class="separator"></div>

	<!-- Link -->
	<button
		class="toolbar-button"
		class:active={editor?.isActive('link')}
		onclick={toggleLink}
		disabled={!editor}
		title={m.toolbar_link()}
	>
		<LinkIcon size={16} />
	</button>

	<div class="separator"></div>

	<!-- Lists -->
	<button
		class="toolbar-button"
		class:active={editor?.isActive('bulletList')}
		onclick={() => editor?.chain().focus().toggleBulletList().run()}
		disabled={!editor}
		title={m.toolbar_bullet_list()}
	>
		<List size={16} />
	</button>

	<button
		class="toolbar-button"
		class:active={editor?.isActive('orderedList')}
		onclick={() => editor?.chain().focus().toggleOrderedList().run()}
		disabled={!editor}
		title={m.toolbar_ordered_list()}
	>
		<ListOrdered size={16} />
	</button>
</div>

<LinkDialog />

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.description-toolbar {
		display: flex;
		align-items: center;
		gap: $unit-half;
		padding: $unit;
		background: var(--button-bg);
		border-radius: $card-corner;
	}

	.separator {
		width: 1px;
		height: 16px;
		background: var(--border-subtle);
		margin: 0 $unit-half;
	}

	.toolbar-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		padding: 0;
		border: none;
		background: transparent;
		border-radius: $bubble-menu-item-corner;
		cursor: pointer;
		color: var(--text-secondary);
		transition: all 0.15s;

		&:hover:not(:disabled) {
			background: var(--button-bg-hover);
			color: var(--text-primary);
		}

		&.active {
			background: var(--button-bg-active);
			color: var(--text-primary);
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.style-trigger {
		display: flex;
		align-items: center;
		gap: $unit-half;
		width: auto;
		min-width: 100px;
		padding: 0 $unit;
		font-size: $font-small;
		font-weight: $medium;
	}

	:global(.dropdown-menu-item.active) {
		background: var(--button-bg-active);
	}
</style>
