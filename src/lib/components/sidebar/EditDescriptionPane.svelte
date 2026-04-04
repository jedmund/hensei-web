<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { onMount, untrack } from 'svelte'
	import type { Editor, Content } from '@tiptap/core'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import { computePosition, flip, shift, offset } from '@floating-ui/dom'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import EdraEditor from '$lib/components/edra/headless/editor.svelte'
	import LinkDialog from '$lib/components/edra/LinkDialog.svelte'
	import MentionTooltip from '$lib/components/ui/MentionTooltip.svelte'
	import { linkDialogState } from '$lib/stores/linkDialog.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { usePaneStack } from '$lib/stores/paneStack.svelte'

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
		paneId?: string
		description?: string
		onSave: (content: string) => void
	}

	let { paneId, description, onSave }: Props = $props()

	// Bind editor instance (same pattern as superhuman)
	let editor = $state<Editor>()

	// Parse description immediately (not in onMount) so it's available when EdraEditor mounts
	function parseDescription(desc?: string): Content | undefined {
		if (!desc) return undefined
		try {
			return JSON.parse(desc)
		} catch {
			// Legacy plain text - wrap in paragraph
			return {
				type: 'doc',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: desc }] }]
			}
		}
	}

	const initialContent = untrack(() => parseDescription(description))
	const initialDescription = untrack(() => description)

	// Get the pane stack for registering unsaved changes
	const paneStack = usePaneStack()

	// Version counter to trigger reactivity when editor state changes
	let editorVersion = $state(0)
	function onEditorUpdate() {
		editorVersion++
	}

	// Derived label - must use $derived.by() for reactivity in Svelte 5
	// Function calls in templates don't create reactive tracking
	const styleLabel = $derived.by(() => {
		void editorVersion // Force re-evaluation when version changes
		if (editor?.isActive('heading', { level: 1 })) return m.editor_heading_1()
		if (editor?.isActive('heading', { level: 2 })) return m.editor_heading_2()
		if (editor?.isActive('heading', { level: 3 })) return m.editor_heading_3()
		return m.editor_paragraph()
	})

	onMount(() => {
		sidebar.setAction(save, m.action_save())
	})

	// Register unsaved changes check on pane config
	$effect(() => {
		const id = paneId
		untrack(() => {
			if (id) {
				paneStack.updatePaneById(id, {
					hasUnsavedChanges: () => {
						if (!editor) return false
						const current = JSON.stringify(editor.getJSON())
						return current !== (initialDescription ?? 'null')
					}
				})
			}
		})
	})

	$effect(() => {
		if (editor) {
			editor.commands.focus('end')
		}
	})

	function save() {
		if (!editor) return
		const json = editor.getJSON()
		const content = JSON.stringify(json)
		onSave(content)
	}

	function setHeading(level: 1 | 2 | 3) {
		// Defer to let dropdown close and focus settle
		requestAnimationFrame(() => {
			editor?.chain().focus().toggleHeading({ level }).run()
			editorVersion++
		})
	}

	function setParagraph() {
		requestAnimationFrame(() => {
			editor?.chain().focus().setParagraph().run()
			editorVersion++
		})
	}

	function toggleLink() {
		if (editor?.isActive('link')) {
			editor?.chain().focus().unsetLink().run()
		} else if (editor) {
			linkDialogState.show(editor)
		}
	}

	// Mention tooltip state
	interface MentionEntity {
		granblue_id: string
		name: { en: string; ja: string }
		type: string
		element: { id: number; slug: string }
		proficiency?: number | number[]
		season?: number | null
		series?: number[] | { id: string; slug: string; name: { en: string; ja: string } }[] | null
		styleSwap?: boolean
	}

	let tooltipEntity: MentionEntity | null = $state(null)
	let tooltipVisible = $state(false)
	let tooltipEl: HTMLDivElement | null = $state(null)

	// Suppress tooltips while selecting text
	let isSelecting = $state(false)

	function handleMouseDown() {
		isSelecting = true
		tooltipVisible = false
		tooltipEntity = null
	}

	function handleMouseUp() {
		setTimeout(() => {
			isSelecting = false
		}, 100)
	}

	function handleMentionEnter(event: MouseEvent) {
		if (!editor || isSelecting) return
		const target = (event.target as HTMLElement).closest?.('span[data-type="mention"]')
		if (!target) {
			// Mouse is over the editor but not a mention — dismiss tooltip
			if (tooltipVisible) {
				tooltipVisible = false
				tooltipEntity = null
			}
			return
		}

		// Resolve the ProseMirror position from the DOM element
		const pos = editor.view.posAtDOM(target, 0)
		const node = editor.state.doc.nodeAt(pos)
		if (!node || node.type.name !== 'mention') return

		const attrs = node.attrs.id
		if (!attrs) return

		tooltipEntity = {
			granblue_id: attrs.granblue_id ?? '',
			name: attrs.name ?? { en: 'Unknown', ja: 'Unknown' },
			type: attrs.type ?? '',
			element: attrs.element ?? { id: 0, slug: 'null' },
			proficiency: attrs.proficiency,
			season: attrs.season,
			series: attrs.series,
			styleSwap: attrs.styleSwap
		}
		tooltipVisible = true

		requestAnimationFrame(() => {
			if (!tooltipEl) return
			computePosition(target as HTMLElement, tooltipEl, {
				placement: 'top',
				middleware: [offset(8), flip(), shift({ padding: 8 })]
			}).then(({ x, y }) => {
				if (tooltipEl) {
					tooltipEl.style.left = `${x}px`
					tooltipEl.style.top = `${y}px`
				}
			})
		})
	}

	function handleMentionLeave(event: MouseEvent) {
		const related = event.relatedTarget as HTMLElement | null
		if (related?.closest?.('.mention-tooltip-wrapper')) return
		tooltipVisible = false
		tooltipEntity = null
	}

	function handleTooltipLeave(event: MouseEvent) {
		const related = event.relatedTarget as HTMLElement | null
		if (related?.closest?.('span[data-type="mention"]')) return
		tooltipVisible = false
		tooltipEntity = null
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
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="editor-container"
		onmousedown={handleMouseDown}
		onmouseup={handleMouseUp}
		onmouseover={handleMentionEnter}
		onmouseleave={handleMentionLeave}
	>
		<EdraEditor
			bind:editor
			content={initialContent}
			editable={true}
			onUpdate={onEditorUpdate}
			onSelectionUpdate={onEditorUpdate}
			class="description-editor"
		/>
	</div>
</div>

{#if tooltipEntity}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="mention-tooltip-wrapper" bind:this={tooltipEl} onmouseleave={handleTooltipLeave}>
		<MentionTooltip entity={tooltipEntity} visible={tooltipVisible} />
	</div>
{/if}

<LinkDialog />

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
		padding: 0 $unit-2x;
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
		font-size: $font-regular;
		line-height: 1.6;
		outline: none;

		&:focus {
			outline: none;
		}
	}

	:global(.description-editor .ProseMirror a) {
		color: var(--accent-blue);
		text-decoration: none;
	}

	:global(.description-editor .ProseMirror p) {
		margin: 0 0 $unit 0;
	}

	:global(.description-editor .ProseMirror h1),
	:global(.description-editor .ProseMirror h2),
	:global(.description-editor .ProseMirror h3) {
		margin: $unit-2x 0 $unit 0;
	}

	:global(.description-editor .ProseMirror ul),
	:global(.description-editor .ProseMirror ol) {
		margin: $unit 0;
		padding-left: $unit-3x;
	}

	.mention-tooltip-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
		pointer-events: auto;
	}
</style>
