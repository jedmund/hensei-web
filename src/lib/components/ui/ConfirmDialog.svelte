<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		title: string
		message: string
		confirmLabel?: string
		cancelLabel?: string
		loading?: boolean
		onconfirm: () => void
		oncancel?: () => void
	}

	let {
		open = $bindable(false),
		title,
		message,
		confirmLabel = m.action_confirm_delete(),
		cancelLabel = m.action_cancel(),
		loading = false,
		onconfirm,
		oncancel
	}: Props = $props()

	function handleCancel() {
		open = false
		oncancel?.()
	}

	function handleConfirm() {
		onconfirm()
	}
</script>

<Dialog bind:open hideClose>
	<div class="confirm-dialog">
		<h3 class="title">{title}</h3>
		<p class="message">{message}</p>
		<div class="actions">
			<Button variant="ghost" size="small" onclick={handleCancel} disabled={loading}>
				{cancelLabel}
			</Button>
			<Button variant="destructive" size="small" onclick={handleConfirm} {loading}>
				{confirmLabel}
			</Button>
		</div>
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.confirm-dialog {
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

	.message {
		margin: 0;
		font-size: $font-body;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: $unit;
	}
</style>
