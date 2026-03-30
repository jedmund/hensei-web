<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import { linkDialogState } from '$lib/stores/linkDialog.svelte'
	import * as m from '$lib/paraglide/messages'

	let url = $state('')

	$effect(() => {
		if (linkDialogState.open) {
			url = linkDialogState.initialUrl
		}
	})

	function handleInsert() {
		if (url.trim()) {
			linkDialogState.apply(url.trim())
			url = ''
		}
	}

	function handleCancel() {
		linkDialogState.close()
		url = ''
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleInsert()
		}
	}
</script>

<Dialog bind:open={linkDialogState.open} hideClose>
	<div class="link-dialog">
		<h3 class="title">{m.editor_link_dialog_title()}</h3>
		<Input
			type="url"
			placeholder="https://..."
			bind:value={url}
			fullWidth
			onkeydown={handleKeydown}
		/>
		<div class="actions">
			<Button variant="ghost" size="small" onclick={handleCancel}>
				{m.action_cancel()}
			</Button>
			<Button variant="primary" size="small" onclick={handleInsert} disabled={!url.trim()}>
				{m.editor_link_insert()}
			</Button>
		</div>
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.link-dialog {
		padding: $unit-3x;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.title {
		margin: 0;
		font-size: $font-large;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: $unit;
	}
</style>
