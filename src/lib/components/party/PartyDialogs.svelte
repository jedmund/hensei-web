<script lang="ts">
	import { usePartyContext } from '$lib/types/party-context'
	import type { PartyActions } from '$lib/composables/party-actions.svelte'
	import type { WikiImport } from '$lib/composables/wiki-import.svelte'
	import type { ItemAddition } from '$lib/composables/item-addition.svelte'
	import type { PartyDragDrop } from '$lib/composables/party-drag-drop.svelte'
	import type { SolomonisRaid } from '$lib/composables/solomonis-raid.svelte'
	import ConflictDialog from '$lib/components/dialogs/ConflictDialog.svelte'
	import DeleteTeamDialog from '$lib/components/dialogs/DeleteTeamDialog.svelte'
	import DuplicateCollectionDialog from '$lib/components/dialogs/DuplicateCollectionDialog.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import WikiTextDialog from '$lib/components/party/WikiTextDialog.svelte'
	import WikiImportReview from '$lib/components/party/WikiImportReview.svelte'
	import * as m from '$lib/paraglide/messages'

	/**
	 * The party page's dialogs. Their open state lives in the composables that
	 * drive each flow; Party creates those and hands them over as they are.
	 */
	interface Props {
		actions: PartyActions
		wikiImport: WikiImport
		itemAddition: ItemAddition
		partyDragDrop: PartyDragDrop
		solomonisRaid: SolomonisRaid
	}

	let { actions, wikiImport, itemAddition, partyDragDrop, solomonisRaid }: Props = $props()

	const ctx = usePartyContext()
	const party = $derived(ctx.getParty())
</script>

<!-- Delete Confirmation Dialog -->
<DeleteTeamDialog
	bind:open={actions.deleteDialogOpen}
	partyName={party.name || m.party_untitled()}
	deleting={actions.deleting}
	onDelete={actions.deleteParty}
	onCancel={() => (actions.deleteDialogOpen = false)}
/>

<WikiTextDialog
	bind:open={actions.wikiExportOpen}
	title={m.party_export_wiki()}
	description={m.party_export_wiki_description()}
	notice={m.party_export_wiki_notice()}
	details={[
		m.party_export_wiki_lost_rings(),
		m.party_export_wiki_lost_earrings(),
		m.party_export_wiki_lost_artifacts(),
		m.party_export_wiki_lost_ax(),
		m.party_export_wiki_lost_befoulments(),
		m.party_export_wiki_lost_awakening_levels(),
		m.party_export_wiki_lost_masteries(),
		m.party_export_wiki_lost_bullets(),
		m.party_export_wiki_lost_keys(),
		m.party_export_wiki_lost_details()
	]}
	value={actions.wikiExportText}
	readonly
	primaryAction={{ label: m.code_copy(), onclick: actions.copyWikiExport }}
/>

<WikiTextDialog
	bind:open={wikiImport.open}
	title={m.party_import_wiki()}
	description={m.party_import_wiki_description()}
	notice={m.party_import_wiki_notice()}
	details={[
		m.party_import_wiki_missing_bullets(),
		m.party_import_wiki_missing_rings(),
		m.party_import_wiki_missing_ax(),
		m.party_import_wiki_missing_befoulments(),
		m.party_export_wiki_lost_awakening_levels(),
		m.party_export_wiki_lost_masteries(),
		m.party_export_wiki_lost_earrings(),
		m.party_export_wiki_lost_artifacts(),
		m.party_import_wiki_missing_substitutes(),
		m.party_import_wiki_missing_uncaps()
	]}
	bind:value={wikiImport.text}
	placeholder={m.party_import_wiki_placeholder()}
	busy={wikiImport.busy}
	primaryAction={{
		label: wikiImport.report ? m.party_import_wiki_create() : m.party_import_wiki_action(),
		onclick: wikiImport.submit,
		disabled: wikiImport.busy || !wikiImport.text.trim() || wikiImport.report?.matched.length === 0
	}}
>
	{#snippet review()}
		{#if wikiImport.report}
			<WikiImportReview
				report={wikiImport.report}
				notes={wikiImport.notes}
				request={wikiImport.request}
			/>
		{/if}
	{/snippet}
</WikiTextDialog>

<!-- Importing makes a separate team; the one on screen is left as is -->
<ConfirmDialog
	bind:open={wikiImport.confirmOpen}
	title={m.party_import_wiki_confirm_title()}
	message={m.party_import_wiki_confirm_message()}
	confirmLabel={m.party_import_wiki_confirm()}
	confirmVariant="primary"
	onconfirm={wikiImport.confirmStart}
/>

<!-- Leaving Evoking Solomonis deletes its data -->
<ConfirmDialog
	bind:open={solomonisRaid.leaveOpen}
	title={m.solomonis_web_party_leave_title()}
	message={m.solomonis_web_party_leave_message()}
	confirmLabel={m.solomonis_web_party_leave_confirm()}
	onconfirm={solomonisRaid.confirmLeave}
/>

<!-- Conflict Resolution Dialog -->
<ConflictDialog
	bind:open={itemAddition.conflictDialogOpen}
	conflict={itemAddition.conflictData}
	partyId={party.id}
	partyShortcode={party.shortcode}
	onResolve={itemAddition.resolveConflict}
	onCancel={itemAddition.cancelConflict}
/>

<!-- Duplicate Collection Warning Dialog (drag-triggered) -->
<DuplicateCollectionDialog
	open={!!partyDragDrop.pendingDuplicate}
	onConfirm={partyDragDrop.confirmDuplicate}
	onCancel={partyDragDrop.cancelDuplicate}
/>
