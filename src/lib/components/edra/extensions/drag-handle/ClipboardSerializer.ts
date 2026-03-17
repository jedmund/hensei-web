import { Slice } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import * as pmView from '@tiptap/pm/view';

function getPmView() {
	try {
		return pmView;
	} catch (error) {
		if (import.meta.env.DEV) {
			console.error(error);
		}
		return null;
	}
}

export function serializeForClipboard(view: EditorView, slice: Slice) {
	// Newer Tiptap/ProseMirror
	if (view && typeof view.serializeForClipboard === 'function') {
		return view.serializeForClipboard(slice);
	}

	// Older version fallback
	const proseMirrorView = getPmView();

	const pmViewAny = proseMirrorView as Record<string, unknown>;
	if (pmViewAny && typeof pmViewAny.__serializeForClipboard === 'function') {
		return (pmViewAny.__serializeForClipboard as (view: EditorView, slice: Slice) => { dom: HTMLElement; text: string })(view, slice);
	}

	throw new Error('No supported clipboard serialization method found.');
}
