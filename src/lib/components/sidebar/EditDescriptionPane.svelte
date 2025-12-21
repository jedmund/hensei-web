<script lang="ts">
	import { onMount } from 'svelte'
	import type { Editor, Content } from '@tiptap/core'
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

	// Style dropdown state
	let styleDropdownOpen = $state(false)

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
		if (editor?.isActive('heading', { level: 1 })) return 'H1'
		if (editor?.isActive('heading', { level: 2 })) return 'H2'
		if (editor?.isActive('heading', { level: 3 })) return 'H3'
		return 'P'
	}

	function setHeading(level: 1 | 2 | 3) {
		editor?.chain().focus().toggleHeading({ level }).run()
		styleDropdownOpen = false
	}

	function setParagraph() {
		editor?.chain().focus().setParagraph().run()
		styleDropdownOpen = false
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
			<div class="style-dropdown-wrapper">
				<button
					class="toolbar-button style-trigger"
					onclick={() => (styleDropdownOpen = !styleDropdownOpen)}
					disabled={!editor}
				>
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

				{#if styleDropdownOpen}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div class="style-dropdown" onclick={(e) => e.stopPropagation()}>
						<button
							class="style-item"
							class:active={editor?.isActive('heading', { level: 1 })}
							onclick={() => setHeading(1)}
						>
							<Heading1 size={16} />
							<span>Heading 1</span>
						</button>
						<button
							class="style-item"
							class:active={editor?.isActive('heading', { level: 2 })}
							onclick={() => setHeading(2)}
						>
							<Heading2 size={16} />
							<span>Heading 2</span>
						</button>
						<button
							class="style-item"
							class:active={editor?.isActive('heading', { level: 3 })}
							onclick={() => setHeading(3)}
						>
							<Heading3 size={16} />
							<span>Heading 3</span>
						</button>
						<button
							class="style-item"
							class:active={editor?.isActive('paragraph')}
							onclick={setParagraph}
						>
							<Pilcrow size={16} />
							<span>Paragraph</span>
						</button>
					</div>
				{/if}
			</div>

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

<!-- Close dropdown when clicking outside -->
<svelte:window onclick={() => (styleDropdownOpen = false)} />

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

	.style-dropdown-wrapper {
		position: relative;
	}

	.style-trigger {
		display: flex;
		align-items: center;
		gap: $unit-half;
		width: auto;
		min-width: 56px;
		padding: 0 $unit;
		font-size: $font-small;
		font-weight: $medium;
	}

	.style-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 4px;
		background: var(--menu-bg);
		border: 1px solid var(--menu-border);
		border-radius: $card-corner;
		padding: $unit-half;
		min-width: 140px;
		box-shadow: var(--shadow-floating);
		z-index: 100;
	}

	.style-item {
		display: flex;
		align-items: center;
		gap: $unit;
		width: 100%;
		padding: $unit ($unit * 1.5);
		border: none;
		background: transparent;
		border-radius: 6px;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		cursor: pointer;
		text-align: left;

		&:hover {
			background: var(--menu-bg-item-hover);
		}

		&.active {
			background: var(--menu-bg-item-active);
		}
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
