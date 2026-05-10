<script lang="ts">
	/**
	 * Compact rich-text editor for the Role tab's substitution note.
	 *
	 * Wraps the headless `EdraEditor` (Tiptap) with the same toolbar styling as
	 * `EditDescriptionPane` but trimmed to the formats that make sense in a
	 * sidebar field: bold / italic / underline / strikethrough / bullet list /
	 * ordered list. `@`-mentions come for free via the `EntityMention`
	 * extension that `EdraEditor` already loads.
	 *
	 * Saves the full Tiptap JSON document on blur (skipped if unchanged from the
	 * baseline captured on first load), so the parent doesn't have to debounce.
	 */
	import type { Editor, Content } from '@tiptap/core'
	import EdraEditor from '$lib/components/edra/headless/editor.svelte'
	import Bold from '@lucide/svelte/icons/bold'
	import Italic from '@lucide/svelte/icons/italic'
	import Underline from '@lucide/svelte/icons/underline'
	import StrikeThrough from '@lucide/svelte/icons/strikethrough'
	import List from '@lucide/svelte/icons/list'
	import ListOrdered from '@lucide/svelte/icons/list-ordered'
	import * as m from '$lib/paraglide/messages'
	import type { SubstitutionNote } from '$lib/types/api/party'
	import { untrack } from 'svelte'

	interface Props {
		value?: SubstitutionNote | null
		placeholder?: string
		onSave: (next: SubstitutionNote | null) => void
	}

	let { value, placeholder, onSave }: Props = $props()

	let editor = $state<Editor>()
	let baselineJson = $state<string | null>(null)
	let editorVersion = $state(0)

	function toContent(raw: SubstitutionNote | null | undefined): Content | undefined {
		if (raw == null) return undefined
		if (typeof raw === 'object' && (raw as { type?: string }).type === 'doc') return raw as Content
		// Defensive fallback for legacy plain strings.
		if (typeof raw === 'string') {
			return {
				type: 'doc',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }]
			}
		}
		return raw as Content
	}

	const initialContent = untrack(() => toContent(value))

	function isEmptyDoc(doc: SubstitutionNote): boolean {
		const content = (doc as { content?: unknown[] }).content
		if (!Array.isArray(content) || content.length === 0) return true
		if (content.length === 1) {
			const para = content[0] as { type?: string; content?: unknown[] }
			if (para?.type === 'paragraph' && (!para.content || para.content.length === 0)) return true
		}
		return false
	}

	$effect(() => {
		if (editor && baselineJson === null) {
			baselineJson = JSON.stringify(editor.getJSON())
		}
	})

	function handleBlur() {
		if (!editor) return
		const json = editor.getJSON() as SubstitutionNote
		const serialized = JSON.stringify(json)
		if (serialized === baselineJson) return
		baselineJson = serialized
		onSave(isEmptyDoc(json) ? null : json)
	}

	function bumpVersion() {
		editorVersion++
	}

	function isActive(name: string, attrs?: Record<string, unknown>): boolean {
		void editorVersion
		return editor?.isActive(name, attrs) ?? false
	}
</script>

<div class="role-note-editor" onfocusout={handleBlur} role="presentation">
	<div class="toolbar-container">
		<div class="role-note-toolbar" role="toolbar" aria-label="Formatting">
			<button
				type="button"
				class="toolbar-button"
				class:active={isActive('bold')}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => {
					editor?.chain().focus().toggleBold().run()
					bumpVersion()
				}}
				disabled={!editor}
				title={m.toolbar_bold()}
			>
				<Bold size={16} />
			</button>

			<button
				type="button"
				class="toolbar-button"
				class:active={isActive('italic')}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => {
					editor?.chain().focus().toggleItalic().run()
					bumpVersion()
				}}
				disabled={!editor}
				title={m.toolbar_italic()}
			>
				<Italic size={16} />
			</button>

			<button
				type="button"
				class="toolbar-button"
				class:active={isActive('underline')}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => {
					editor?.chain().focus().toggleUnderline().run()
					bumpVersion()
				}}
				disabled={!editor}
				title={m.toolbar_underline()}
			>
				<Underline size={16} />
			</button>

			<button
				type="button"
				class="toolbar-button"
				class:active={isActive('strike')}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => {
					editor?.chain().focus().toggleStrike().run()
					bumpVersion()
				}}
				disabled={!editor}
				title={m.toolbar_strikethrough()}
			>
				<StrikeThrough size={16} />
			</button>

			<div class="separator"></div>

			<button
				type="button"
				class="toolbar-button"
				class:active={isActive('bulletList')}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => {
					editor?.chain().focus().toggleBulletList().run()
					bumpVersion()
				}}
				disabled={!editor}
				title={m.toolbar_bullet_list()}
			>
				<List size={16} />
			</button>

			<button
				type="button"
				class="toolbar-button"
				class:active={isActive('orderedList')}
				onmousedown={(e) => e.preventDefault()}
				onclick={() => {
					editor?.chain().focus().toggleOrderedList().run()
					bumpVersion()
				}}
				disabled={!editor}
				title={m.toolbar_ordered_list()}
			>
				<ListOrdered size={16} />
			</button>
		</div>
	</div>

	<div class="editor-container" data-placeholder={placeholder ?? ''}>
		<EdraEditor
			bind:editor
			content={initialContent}
			editable={true}
			onUpdate={bumpVersion}
			onSelectionUpdate={bumpVersion}
			class="role-note-tiptap"
		/>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.role-note-editor {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.toolbar-container {
		flex-shrink: 0;
	}

	.role-note-toolbar {
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

	.editor-container {
		min-height: 120px;
		padding: $unit;
		background: var(--input-bound-bg);
		border-radius: $unit;
		font-size: $font-regular;
		line-height: 1.5;

		&:focus-within {
			outline: 2px solid var(--accent-blue);
			outline-offset: 0;
		}
	}

	:global(.role-note-tiptap) {
		min-height: 100px;
	}

	:global(.role-note-tiptap .tiptap) {
		min-height: 100px;
		outline: none;
		color: var(--text-primary);
	}

	:global(.role-note-tiptap .tiptap p) {
		margin: 0;
	}
</style>
