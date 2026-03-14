<!--
  DORMANT COMPONENT — Currently unused.
  Origin: Scaffolded for the party description rich text editor toolbar (TipTap integration).
  Intended feature: Formatting toolbar (headings, bold/italic/underline, links, lists) for party descriptions.
  Never wired up — the description editor feature is not yet migrated from Next.js.
-->
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Editor } from '@tiptap/core'
	import Button from '$lib/components/ui/Button.svelte'
	import { DropdownMenu } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'

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

	interface Props {
		editor: Editor
	}

	let { editor }: Props = $props()

	function getStyleLabel(): string {
		if (editor.isActive('heading', { level: 1 })) return 'H1'
		if (editor.isActive('heading', { level: 2 })) return 'H2'
		if (editor.isActive('heading', { level: 3 })) return 'H3'
		return 'P'
	}

	function setHeading(level: 1 | 2 | 3) {
		editor.chain().focus().toggleHeading({ level }).run()
	}

	function setParagraph() {
		editor.chain().focus().setParagraph().run()
	}

	function toggleBold() {
		editor.chain().focus().toggleBold().run()
	}

	function toggleItalic() {
		editor.chain().focus().toggleItalic().run()
	}

	function toggleUnderline() {
		editor.chain().focus().toggleUnderline().run()
	}

	function toggleStrike() {
		editor.chain().focus().toggleStrike().run()
	}

	function toggleLink() {
		if (editor.isActive('link')) {
			editor.chain().focus().unsetLink().run()
		} else {
			const url = window.prompt(m.editor_prompt_url())
			if (url) {
				editor.chain().focus().toggleLink({ href: url }).run()
			}
		}
	}

	function toggleBulletList() {
		editor.chain().focus().toggleBulletList().run()
	}

	function toggleOrderedList() {
		editor.chain().focus().toggleOrderedList().run()
	}
</script>

<div class="description-toolbar">
	<!-- Text Style Dropdown -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="small" class="style-trigger">
					{#snippet leftAccessory()}
						{#if editor.isActive('heading', { level: 1 })}
							<Heading1 size={16} />
						{:else if editor.isActive('heading', { level: 2 })}
							<Heading2 size={16} />
						{:else if editor.isActive('heading', { level: 3 })}
							<Heading3 size={16} />
						{:else}
							<Pilcrow size={16} />
						{/if}
					{/snippet}
					{getStyleLabel()}
					{#snippet rightAccessory()}
						<Icon name="chevron-down" size={12} />
					{/snippet}
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Portal>
			<DropdownMenu.Content align="start" sideOffset={4} class="style-dropdown">
				<DropdownMenu.Item
					class="style-item {editor.isActive('heading', { level: 1 }) ? 'active' : ''}"
					onSelect={() => setHeading(1)}
				>
					<Heading1 size={16} />
					<span>{m.editor_heading_1()}</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="style-item {editor.isActive('heading', { level: 2 }) ? 'active' : ''}"
					onSelect={() => setHeading(2)}
				>
					<Heading2 size={16} />
					<span>{m.editor_heading_2()}</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="style-item {editor.isActive('heading', { level: 3 }) ? 'active' : ''}"
					onSelect={() => setHeading(3)}
				>
					<Heading3 size={16} />
					<span>{m.editor_heading_3()}</span>
				</DropdownMenu.Item>
				<DropdownMenu.Item
					class="style-item {editor.isActive('paragraph') ? 'active' : ''}"
					onSelect={setParagraph}
				>
					<Pilcrow size={16} />
					<span>{m.editor_paragraph()}</span>
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Portal>
	</DropdownMenu.Root>

	<div class="separator"></div>

	<!-- Text Formatting -->
	<Button
		variant="ghost"
		size="icon"
		iconOnly
		onclick={toggleBold}
		active={editor.isActive('bold')}
		title={m.toolbar_bold()}
		class="toolbar-button"
	>
		<Bold size={16} />
	</Button>

	<Button
		variant="ghost"
		size="icon"
		iconOnly
		onclick={toggleItalic}
		active={editor.isActive('italic')}
		title={m.toolbar_italic()}
		class="toolbar-button"
	>
		<Italic size={16} />
	</Button>

	<Button
		variant="ghost"
		size="icon"
		iconOnly
		onclick={toggleUnderline}
		active={editor.isActive('underline')}
		title={m.toolbar_underline()}
		class="toolbar-button"
	>
		<Underline size={16} />
	</Button>

	<Button
		variant="ghost"
		size="icon"
		iconOnly
		onclick={toggleStrike}
		active={editor.isActive('strike')}
		title={m.toolbar_strikethrough()}
		class="toolbar-button"
	>
		<StrikeThrough size={16} />
	</Button>

	<div class="separator"></div>

	<!-- Link -->
	<Button
		variant="ghost"
		size="icon"
		iconOnly
		onclick={toggleLink}
		active={editor.isActive('link')}
		title={m.toolbar_link()}
		class="toolbar-button"
	>
		<LinkIcon size={16} />
	</Button>

	<div class="separator"></div>

	<!-- Lists -->
	<Button
		variant="ghost"
		size="icon"
		iconOnly
		onclick={toggleBulletList}
		active={editor.isActive('bulletList')}
		title={m.toolbar_bullet_list()}
		class="toolbar-button"
	>
		<List size={16} />
	</Button>

	<Button
		variant="ghost"
		size="icon"
		iconOnly
		onclick={toggleOrderedList}
		active={editor.isActive('orderedList')}
		title={m.toolbar_ordered_list()}
		class="toolbar-button"
	>
		<ListOrdered size={16} />
	</Button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/colors' as *;
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

	:global(.style-trigger) {
		gap: $unit-half;
		min-width: 56px;
	}

	:global(.toolbar-button) {
		width: 28px;
		height: 28px;
		padding: 0;
	}

	:global(.style-dropdown) {
		background: var(--menu-bg);
		border: 1px solid var(--menu-border);
		border-radius: $card-corner;
		padding: $unit-half;
		min-width: 140px;
		box-shadow: var(--shadow-floating);
	}

	:global(.style-item) {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit ($unit * 1.5);
		border-radius: $bubble-menu-item-corner;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		cursor: pointer;
		outline: none;

		&:hover {
			background: var(--menu-bg-item-hover);
		}

		&.active {
			background: var(--menu-bg-item-active);
		}
	}
</style>
