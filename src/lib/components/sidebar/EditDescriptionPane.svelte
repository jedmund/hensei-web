<script lang="ts">
	import { onMount } from 'svelte'
	import type { Editor, Content } from '@tiptap/core'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import EdraEditor from '$lib/components/edra/headless/editor.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'

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
		description?: string
		onSave: (content: string) => void
	}

	let { description, onSave }: Props = $props()

	// Bind editor instance (same pattern as superhuman)
	let editor = $state<Editor>()
	let initialContent = $state<Content | undefined>()

	// Parse description JSON on mount
	onMount(() => {
		if (description) {
			try {
				initialContent = JSON.parse(description)
			} catch {
				// Legacy plain text - wrap in paragraph
				initialContent = {
					type: 'doc',
					content: [{ type: 'paragraph', content: [{ type: 'text', text: description }] }]
				}
			}
		}

		sidebar.setAction(save, 'Save')
	})

	function save() {
		if (!editor) return
		const json = editor.getJSON()
		const content = JSON.stringify(json)
		onSave(content)
	}

	function getStyleLabel(): string {
		if (editor?.isActive('heading', { level: 1 })) return 'Heading 1'
		if (editor?.isActive('heading', { level: 2 })) return 'Heading 2'
		if (editor?.isActive('heading', { level: 3 })) return 'Heading 3'
		return 'Paragraph'
	}

	function setHeading(level: 1 | 2 | 3) {
		editor?.chain().focus().toggleHeading({ level }).run()
	}

	function setParagraph() {
		editor?.chain().focus().setParagraph().run()
	}

	function toggleLink() {
		if (editor?.isActive('link')) {
			editor?.chain().focus().unsetLink().run()
		} else {
			const url = window.prompt('Enter the URL:')
			if (url) {
				editor?.chain().focus().toggleLink({ href: url }).run()
			}
		}
	}
</script>

<div class="edit-description-pane">
	<!-- Inline Toolbar (same pattern as superhuman) -->
	<div class="toolbar-container">
		<div class="description-toolbar">
			<!-- Text Style Dropdown -->
			<DropdownMenu>
				{#snippet trigger({ props })}
					<button class="toolbar-button style-trigger" disabled={!editor} {...props}>
						{#if editor?.isActive('heading', { level: 1 })}
							<Heading1 size={16} />
						{:else if editor?.isActive('heading', { level: 2 })}
							<Heading2 size={16} />
						{:else if editor?.isActive('heading', { level: 3 })}
							<Heading3 size={16} />
						{:else}
							<Pilcrow size={16} />
						{/if}
						<span>{getStyleLabel()}</span>
						<ChevronDown size={12} />
					</button>
				{/snippet}
				{#snippet menu()}
					<DropdownMenuBase.Item
						class="dropdown-menu-item {editor?.isActive('heading', { level: 1 }) ? 'active' : ''}"
						onSelect={() => setHeading(1)}
					>
						<Heading1 size={16} />
						<span>Heading 1</span>
					</DropdownMenuBase.Item>
					<DropdownMenuBase.Item
						class="dropdown-menu-item {editor?.isActive('heading', { level: 2 }) ? 'active' : ''}"
						onSelect={() => setHeading(2)}
					>
						<Heading2 size={16} />
						<span>Heading 2</span>
					</DropdownMenuBase.Item>
					<DropdownMenuBase.Item
						class="dropdown-menu-item {editor?.isActive('heading', { level: 3 }) ? 'active' : ''}"
						onSelect={() => setHeading(3)}
					>
						<Heading3 size={16} />
						<span>Heading 3</span>
					</DropdownMenuBase.Item>
					<DropdownMenuBase.Item
						class="dropdown-menu-item {editor?.isActive('paragraph') ? 'active' : ''}"
						onSelect={setParagraph}
					>
						<Pilcrow size={16} />
						<span>Paragraph</span>
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
				title="Bold"
			>
				<Bold size={16} />
			</button>

			<button
				class="toolbar-button"
				class:active={editor?.isActive('italic')}
				onclick={() => editor?.chain().focus().toggleItalic().run()}
				disabled={!editor}
				title="Italic"
			>
				<Italic size={16} />
			</button>

			<button
				class="toolbar-button"
				class:active={editor?.isActive('underline')}
				onclick={() => editor?.chain().focus().toggleUnderline().run()}
				disabled={!editor}
				title="Underline"
			>
				<Underline size={16} />
			</button>

			<button
				class="toolbar-button"
				class:active={editor?.isActive('strike')}
				onclick={() => editor?.chain().focus().toggleStrike().run()}
				disabled={!editor}
				title="Strikethrough"
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
				title="Link"
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
				title="Bullet List"
			>
				<List size={16} />
			</button>

			<button
				class="toolbar-button"
				class:active={editor?.isActive('orderedList')}
				onclick={() => editor?.chain().focus().toggleOrderedList().run()}
				disabled={!editor}
				title="Ordered List"
			>
				<ListOrdered size={16} />
			</button>
		</div>
	</div>

	<div class="editor-container">
		<EdraEditor
			bind:editor
			content={initialContent}
			editable={true}
			class="description-editor"
		/>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.edit-description-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.toolbar-container {
		flex-shrink: 0;
		padding: $unit-2x;
		padding-bottom: 0;
	}

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
		border-radius: 6px;
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

	.editor-container {
		flex: 1;
		overflow-y: auto;
		padding: $unit-2x;
	}

	:global(.description-editor) {
		min-height: 200px;
		outline: none;

		&:focus {
			outline: none;
		}
	}

	// Override Edra editor styles for our context
	:global(.description-editor .ProseMirror) {
		min-height: 200px;
		outline: none;

		&:focus {
			outline: none;
		}

		p {
			margin: 0 0 $unit 0;
		}

		h1,
		h2,
		h3 {
			margin: $unit-2x 0 $unit 0;
		}

		ul,
		ol {
			margin: $unit 0;
			padding-left: $unit-3x;
		}
	}
</style>
