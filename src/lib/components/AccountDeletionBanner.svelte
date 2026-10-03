<script lang="ts">
	import { invalidateAll } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import Notice from '$lib/components/ui/Notice.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import { formatDate } from '$lib/utils/date'

	interface Props {
		/** When the account will be deleted (ISO string). */
		deletionScheduledAt: string
	}

	let { deletionScheduledAt }: Props = $props()

	let confirmOpen = $state(false)
	let cancelling = $state(false)

	const date = $derived(
		formatDate(deletionScheduledAt, { year: 'numeric', month: 'long', day: 'numeric' })
	)

	async function cancelDeletion() {
		cancelling = true
		try {
			const res = await fetch('/api/account/deletion', { method: 'DELETE' })
			if (!res.ok) throw new Error('cancel failed')

			confirmOpen = false
			toast.success(m.account_deletion_cancelled())
			await invalidateAll()
		} catch {
			toast.error(m.account_deletion_cancel_error())
		} finally {
			cancelling = false
		}
	}
</script>

<div class="account-deletion-banner">
	<Notice variant="red">
		<div class="content">
			<p>{m.account_deletion_banner_text({ date })}</p>
			<Button variant="secondary" size="small" onclick={() => (confirmOpen = true)}>
				{m.account_deletion_cancel_action()}
			</Button>
		</div>
	</Notice>
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	title={m.account_deletion_cancel_title()}
	message={m.account_deletion_cancel_message()}
	confirmLabel={m.account_deletion_cancel_confirm()}
	cancelLabel={m.account_deletion_cancel_dismiss()}
	confirmVariant="primary"
	loading={cancelling}
	onconfirm={cancelDeletion}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.account-deletion-banner {
		max-width: var(--main-max-width);
		margin: 0 auto $unit-2x;
	}

	.content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: $unit-2x;
		width: 100%;

		p {
			margin: 0;
		}
	}
</style>
