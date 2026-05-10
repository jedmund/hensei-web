<script lang="ts">
	/**
	 * Compact rich-text editor for the Role tab's substitution note.
	 *
	 * Wraps the headless `EdraEditor` (Tiptap) with a tight inline toolbar that
	 * exposes only bold / italic / strikethrough — `@`-mentions are handled by
	 * the existing `EntityMention` extension which the editor already loads via
	 * `initEditor()`.
	 *
	 * Saves the full Tiptap JSON document on blur (skipped if unchanged from the
	 * baseline captured on first load), so the parent doesn't have to debounce.
	 */
	import { onMount, untrack } from 'svelte'
	import type { Editor, Content } from '@tiptap/core'
	import EdraEditor from '$lib/components/edra/headless/editor.svelte'
	import Bold from '@lucide/svelte/icons/bold'
	import Italic from '@lucide/svelte/icons/italic'
	import StrikeThrough from '@lucide/svelte/icons/strikethrough'
	import type { SubstitutionNote } from '$lib/types/api/party'

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
		// Already a Tiptap doc.
		if (typeof raw === 'object' && (raw as { type?: string }).type === 'doc') return raw as Content
		// Defensive fallback for legacy plain strings (post-migration this shouldn't
		// happen, but it's cheap insurance).
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
		// Single empty paragraph counts as empty.
		if (content.length === 1) {
			const para = content[0] as { type?: string; content?: unknown[] }
			if (para?.type === 'paragraph' && (!para.content || para.content.length === 0)) return true
		}
		return false
	}

	onMount(() => {
		// Capture baseline after the editor mounts so unchanged blurs don't fire
		// a save with normalized-but-equivalent JSON.
	})

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

	function toggleBold() {
		editor?.chain().focus().toggleBold().run()
		bumpVersion()
	}
	function toggleItalic() {
		editor?.chain().focus().toggleItalic().run()
		bumpVersion()
	}
	function toggleStrike() {
		editor?.chain().focus().toggleStrike().run()
		bumpVersion()
	}
</script>

<div class="role-note-editor" onfocusout={handleBlur} role="presentation">
	<div class="toolbar" role="toolbar" aria-label="Formatting">
		<button
			type="button"
			class="tool"
			class:active={isActive('bold')}
			onmousedown={(e) => e.preventDefault()}
			onclick={toggleBold}
			aria-pressed={isActive('bold')}
			title="Bold"
		>
			<Bold size={14} />
		</button>
		<button
			type="button"
			class="tool"
			class:active={isActive('italic')}
			onmousedown={(e) => e.preventDefault()}
			onclick={toggleItalic}
			aria-pressed={isActive('italic')}
			title="Italic"
		>
			<Italic size={14} />
		</button>
		<button
			type="button"
			class="tool"
			class:active={isActive('strike')}
			onmousedown={(e) => e.preventDefault()}
			onclick={toggleStrike}
			aria-pressed={isActive('strike')}
			title="Strikethrough"
		>
			<StrikeThrough size={14} />
		</button>
	</div>

	<div class="editor-wrap" data-placeholder={placeholder ?? ''}>
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
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.role-note-editor {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		background: var(--input-bound-bg);
		border-radius: spacing.$unit;
		padding: spacing.$unit;

		&:focus-within {
			outline: 2px solid var(--accent-blue);
			outline-offset: 0;
		}
	}

	.toolbar {
		display: flex;
		gap: 2px;
	}

	.tool {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		padding: 0;
		border: none;
		border-radius: layout.$item-corner-small;
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition:
			color 0.15s ease,
			background 0.15s ease;

		&:hover {
			color: var(--text-primary);
			background: var(--input-bound-bg-hover);
		}

		&.active {
			color: var(--text-primary);
			background: var(--input-bound-bg-hover);
		}
	}

	.editor-wrap {
		min-height: 60px;
		font-size: typography.$font-small;
		line-height: 1.5;

		:global(.role-note-tiptap) {
			min-height: 60px;
		}

		:global(.role-note-tiptap .tiptap) {
			min-height: 60px;
			outline: none;
			color: var(--text-primary);
		}

		:global(.role-note-tiptap .tiptap p) {
			margin: 0;
		}
	}
</style>
