<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Button from '../ui/Button.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'

	interface Props {
		/** Where the password reset email goes. */
		email: string
		/** Called once the dismissal is saved, so the parent can hide the banner. */
		onDismissed: () => void
	}

	let { email, onDismissed }: Props = $props()

	let status = $state<'idle' | 'sending' | 'sent' | 'error'>('idle')
	let dismissing = $state(false)
	let dismissError = $state(false)

	// There's no "change password" endpoint that skips the current password
	// (a stolen session could add one quietly), so the reset email sets it.
	async function setPassword() {
		status = 'sending'
		try {
			await userAdapter.requestPasswordReset(email)
			status = 'sent'
		} catch {
			status = 'error'
		}
	}

	async function dismiss() {
		dismissing = true
		dismissError = false
		try {
			await userAdapter.dismissPasswordPrompt()
			onDismissed()
		} catch {
			dismissError = true
		} finally {
			dismissing = false
		}
	}
</script>

<div class="banner" role="region" aria-label={m.settings_password_banner_action()}>
	<p class="text">{m.settings_password_banner_text()}</p>

	{#if status === 'sent'}
		<p class="status" role="status">{m.settings_password_banner_sent()}</p>
	{:else if status === 'error'}
		<p class="status error" role="status">{m.settings_password_banner_error()}</p>
	{/if}
	{#if dismissError}
		<p class="status error" role="status">{m.settings_save_error()}</p>
	{/if}

	<div class="actions">
		{#if status !== 'sent'}
			<Button
				variant="primary"
				size="small"
				disabled={status === 'sending' || !email}
				onclick={setPassword}
			>
				{status === 'sending'
					? m.settings_password_banner_sending()
					: m.settings_password_banner_action()}
			</Button>
		{/if}
		<Button variant="ghost" size="small" disabled={dismissing} onclick={dismiss}>
			{m.settings_password_banner_dismiss()}
		</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.banner {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		border-radius: spacing.$unit;
		background: var(--button-bg, rgba(128, 128, 128, 0.12));
	}

	.text,
	.status {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-primary);
	}

	.status.error {
		color: var(--danger, #d64545);
	}

	.actions {
		display: flex;
		gap: spacing.$unit;
		justify-content: flex-end;
	}
</style>
