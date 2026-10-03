<script lang="ts">
	import { goto } from '$app/navigation'
	import { toast } from 'svelte-sonner'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime.js'
	import Button from '../ui/Button.svelte'
	import Input from '../ui/Input.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import ConfirmDialog from '../ui/ConfirmDialog.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import { formatDate } from '$lib/utils/date'

	interface Props {
		/** Accounts without a password set one (via the reset email) before deleting. */
		hasPassword: boolean
		/** Where the password email goes. */
		email: string
	}

	let { hasPassword, email }: Props = $props()

	let open = $state(false)
	let password = $state('')
	let submitting = $state(false)
	let error = $state('')
	let resetStatus = $state<'idle' | 'sending' | 'sent' | 'error'>('idle')

	function openDialog() {
		password = ''
		error = ''
		resetStatus = 'idle'
		open = true
	}

	async function requestDeletion() {
		submitting = true
		error = ''
		try {
			const res = await fetch('/api/account/deletion', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ password })
			})
			const data = (await res.json().catch(() => ({}))) as {
				error?: string
				deletionScheduledAt?: string | null
			}

			if (!res.ok) {
				error =
					data.error === 'invalid_password'
						? m.account_deletion_invalid_password()
						: res.status === 429
							? m.account_deletion_rate_limited()
							: m.account_deletion_request_error()
				return
			}

			open = false
			const date = data.deletionScheduledAt
				? formatDate(data.deletionScheduledAt, { year: 'numeric', month: 'long', day: 'numeric' })
				: ''
			toast.success(m.account_deletion_requested({ date }))
			// The API signed us out everywhere; reload the app logged out.
			await goto(localizeHref('/'), { invalidateAll: true })
		} catch {
			error = m.account_deletion_request_error()
		} finally {
			submitting = false
		}
	}

	async function sendPasswordEmail() {
		resetStatus = 'sending'
		try {
			await userAdapter.requestPasswordReset(email)
			resetStatus = 'sent'
		} catch {
			resetStatus = 'error'
		}
	}
</script>

<h3 class="section-header">{m.account_deletion_section()}</h3>

<SettingsRow title={m.account_deletion_title()} subtitle={m.account_deletion_subtitle()}>
	{#snippet control()}
		<Button variant="destructive-ghost" size="small" onclick={openDialog}>
			{m.account_deletion_action()}
		</Button>
	{/snippet}
</SettingsRow>

{#if hasPassword}
	<ConfirmDialog
		bind:open
		title={m.account_deletion_confirm_title()}
		message={m.account_deletion_confirm_message()}
		confirmLabel={m.account_deletion_confirm_action()}
		loading={submitting}
		confirmDisabled={password === ''}
		onconfirm={requestDeletion}
	>
		<Input
			type="password"
			placeholder={m.account_deletion_password_placeholder()}
			autocomplete="current-password"
			contained
			fullWidth
			bind:value={password}
			{error}
		/>
	</ConfirmDialog>
{:else}
	<ConfirmDialog
		bind:open
		title={m.account_deletion_confirm_title()}
		message={m.account_deletion_needs_password()}
		confirmLabel={resetStatus === 'sending'
			? m.settings_password_banner_sending()
			: m.settings_password_banner_action()}
		confirmVariant="primary"
		loading={resetStatus === 'sending'}
		confirmDisabled={resetStatus === 'sent' || !email}
		onconfirm={sendPasswordEmail}
	>
		{#if resetStatus === 'sent'}
			<p class="status" role="status">{m.settings_password_banner_sent()}</p>
		{:else if resetStatus === 'error'}
			<p class="status error" role="status">{m.settings_password_banner_error()}</p>
		{/if}
	</ConfirmDialog>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.section-header {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: spacing.$unit-2x 0 0;
	}

	.status {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-primary);

		&.error {
			color: var(--danger, #d64545);
		}
	}
</style>
