<script lang="ts">
	/**
	 * Read-only Tiptap renderer for the role note. Mirrors the editor's
	 * formatting (bold, italic, underline, strike, lists, mentions) without any
	 * toolbar or edit affordances.
	 */
	import type { Content } from '@tiptap/core'
	import EdraEditor from '$lib/components/edra/headless/editor.svelte'
	import type { SubstitutionNote } from '$lib/types/api/party'
	import { untrack } from 'svelte'

	interface Props {
		value?: SubstitutionNote | null
	}

	let { value }: Props = $props()

	function toContent(raw: SubstitutionNote | null | undefined): Content | undefined {
		if (raw == null) return undefined
		if (typeof raw === 'object' && (raw as { type?: string }).type === 'doc') return raw as Content
		if (typeof raw === 'string') {
			return {
				type: 'doc',
				content: [{ type: 'paragraph', content: [{ type: 'text', text: raw }] }]
			}
		}
		return raw as Content
	}

	const initialContent = untrack(() => toContent(value))
</script>

{#if initialContent}
	<div class="role-note-view">
		<EdraEditor content={initialContent} editable={false} class="role-note-readonly" />
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/typography' as *;

	.role-note-view {
		font-size: $font-regular;
		line-height: 1.5;
		color: var(--text-primary);
	}

	:global(.role-note-readonly .tiptap) {
		outline: none;
	}

	:global(.role-note-readonly .tiptap p) {
		margin: 0 0 0.5em;
	}

	:global(.role-note-readonly .tiptap p:last-child) {
		margin-bottom: 0;
	}

	:global(.role-note-readonly .tiptap ul),
	:global(.role-note-readonly .tiptap ol) {
		margin: 0 0 0.5em;
		padding-left: 1.25em;
	}
</style>
