<script lang="ts">
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { UnsavedChangesGuard } from './unsavedChanges.svelte'

	const { guard }: { guard: UnsavedChangesGuard } = $props()
</script>

<ConfirmDialog
	bind:open={guard.confirming}
	title={m.dialog_unsaved_changes_title()}
	message={m.dialog_unsaved_changes_message()}
	confirmLabel={m.dialog_unsaved_close()}
	cancelLabel={m.dialog_unsaved_nevermind()}
	onconfirm={() => guard.discard()}
	oncancel={() => guard.keep()}
/>
