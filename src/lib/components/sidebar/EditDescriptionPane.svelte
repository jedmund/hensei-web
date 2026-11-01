<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { onMount, untrack } from 'svelte'
	import type { Editor } from '@tiptap/core'
	import EdraEditor from '$lib/components/edra/headless/editor.svelte'
	import DescriptionToolbar from './DescriptionToolbar.svelte'
	import MentionTooltip from '$lib/components/ui/MentionTooltip.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { usePaneStack } from '$lib/stores/paneStack.svelte'
	import { descriptionToContent } from '$lib/utils/descriptionContent'
	import { useMentionTooltip } from '$lib/composables/mention-tooltip.svelte'

	interface Props {
		paneId?: string
		description?: string
		onSave: (content: string) => void
	}

	let { paneId, description, onSave }: Props = $props()

	// Bind editor instance (same pattern as superhuman)
	let editor = $state<Editor>()

	// Parse description immediately (not in onMount) so it's available when EdraEditor mounts
	const initialContent = untrack(() => descriptionToContent(description))

	// Get the pane stack for registering unsaved changes
	const paneStack = usePaneStack()

	// Baseline JSON captured after TipTap normalizes the content on load
	let baselineJson = $state<string | null>(null)

	// Version counter to trigger reactivity when editor state changes
	let editorVersion = $state(0)
	function onEditorUpdate() {
		editorVersion++
	}

	onMount(() => {
		sidebar.setAction(save, m.action_save())
	})

	// Capture baseline JSON after TipTap normalizes content, then focus
	$effect(() => {
		if (editor) {
			if (baselineJson === null) {
				baselineJson = JSON.stringify(editor.getJSON())
			}
			editor.commands.focus('end')
		}
	})

	// Register unsaved changes check on pane config
	$effect(() => {
		const id = paneId
		untrack(() => {
			if (id) {
				paneStack.updatePaneById(id, {
					hasUnsavedChanges: () => {
						if (!editor || baselineJson === null) return false
						return JSON.stringify(editor.getJSON()) !== baselineJson
					}
				})
			}
		})
	})

	function save() {
		if (!editor) return
		const json = editor.getJSON()
		const content = JSON.stringify(json)
		onSave(content)
	}

	// Mention tooltip: resolve the entity from the ProseMirror node under the mention
	const tooltip = useMentionTooltip({
		selector: 'span[data-type="mention"]',
		dismissOffMention: true,
		resolve(target) {
			if (!editor) return null
			const pos = editor.view.posAtDOM(target, 0)
			const node = editor.state.doc.nodeAt(pos)
			if (!node || node.type.name !== 'mention') return null

			const attrs = node.attrs.id
			if (!attrs) return null

			return {
				type: attrs.type ?? attrs.searchableType?.toLowerCase() ?? 'unknown',
				granblue_id: attrs.granblue_id ?? '',
				name: attrs.name ?? { en: 'Unknown', ja: 'Unknown' },
				element: attrs.element,
				proficiency: attrs.proficiency,
				season: attrs.season,
				series: attrs.series,
				styleSwap: attrs.styleSwap,
				skill: attrs.skill
			}
		}
	})
</script>

<div class="edit-description-pane">
	<!-- Inline Toolbar (same pattern as superhuman) -->
	<div class="toolbar-container">
		<DescriptionToolbar {editor} version={editorVersion} onChange={onEditorUpdate} />
	</div>

	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="editor-container"
		onmousedown={tooltip.handleMouseDown}
		onmouseup={tooltip.handleMouseUp}
		onmouseover={tooltip.handleMentionEnter}
		onmouseleave={tooltip.handleMentionLeave}
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

{#if tooltip.entity}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="mention-tooltip-wrapper"
		bind:this={tooltip.el}
		onmouseleave={tooltip.handleTooltipLeave}
	>
		<MentionTooltip entity={tooltip.entity} visible={tooltip.visible} />
	</div>
{/if}

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
