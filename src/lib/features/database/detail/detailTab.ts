import type { DetailTab } from './DetailScaffold.svelte'

/**
 * Resolve the active detail tab from the `?tab=` param. Raw data is editor-only,
 * so a non-editor who lands on `?tab=raw` sees the Info tab instead.
 */
export function resolveDetailTab(requested: string | null, canEdit: boolean): DetailTab {
	const tab = (requested || 'info') as DetailTab
	if (tab === 'raw' && !canEdit) return 'info'
	return tab
}
