
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Input from '../ui/Input.svelte'
	import Switch from '../ui/switch/Switch.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import type { ElementType } from '../ui/SettingsNav.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'

	interface Props {
		username: string
		email: string
		emailVerified: boolean
		bahamut: boolean
		role: number
		element: ElementType
		onUsernameChange: (value: string) => void
		onEmailChange: (value: string) => void
		onBahamutChange: (value: boolean) => void
	}

	let {
		username,
		email,
		emailVerified,
		bahamut,
		role,
		element,
		onUsernameChange,
		onEmailChange,
		onBahamutChange
	}: Props = $props()

	let resending = $state(false)
	let resendMessage = $state<string | null>(null)

	async function handleResendVerification() {
		resending = true
		resendMessage = null
		try {
			const result = await userAdapter.resendVerificationEmail()
			resendMessage = result.message
		} catch {
			resendMessage = m.settings_verification_resend_error()
		} finally {
			resending = false
		}
	}

	// Local state derived from props — overrides via bind:value are temporary
	let localUsername = $derived(username)
	let localEmail = $derived(email)

	// Propagate changes back to parent
	function handleUsernameInput() {
		onUsernameChange(localUsername)
	}
	function handleEmailInput() {
		onEmailChange(localEmail)
	}

	// Check if user is admin
	const isAdmin = $derived(role === 9)
</script>

<div class="section">
	<div class="form-fields">
		<!-- Username -->
		<Input
			label={m.settings_username()}
			placeholder={m.settings_username_placeholder()}
			contained
			fullWidth
			bind:value={localUsername}
			handleInput={handleUsernameInput}
		/>

		<!-- Email -->
		<div class="email-group">
			<Input
				label={m.settings_email()}
				type="email"
				placeholder={m.settings_email_placeholder()}
				contained
				fullWidth
				bind:value={localEmail}
				handleInput={handleEmailInput}
			/>

			<!-- Email verification status -->
			<div class="verification-status">
			{#if emailVerified}
				<span class="verified">{m.settings_email_verified()}</span>
			{:else}
				<span class="unverified">{m.settings_email_unverified()}</span>
				<button
					class="resend-link"
					onclick={handleResendVerification}
					disabled={resending}
				>
					{resending ? m.settings_verification_resending() : m.settings_verification_resend()}
				</button>
				{#if resendMessage}
					<span class="resend-message">{resendMessage}</span>
				{/if}
			{/if}
			</div>
		</div>

		<!-- Bahamut Mode (admin only) -->
		{#if isAdmin}
			<hr class="separator" />
			<SettingsRow title={m.settings_bahamut_mode()} subtitle={m.settings_bahamut_subtitle()}>
				{#snippet control()}
					<Switch
						checked={bahamut}
						name="bahamut-mode"
						{element}
						onCheckedChange={onBahamutChange}
					/>
				{/snippet}
			</SettingsRow>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.section {
		display: flex;
		flex-direction: column;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.separator {
		border: none;
		border-top: 1px solid var(--separator-bg);
		margin: 0;
	}

	.email-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.verification-status {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		font-size: typography.$font-small;
	}

	.verified {
		color: var(--wind-button-bg, #1dc688);
	}

	.unverified {
		color: var(--text-secondary);
	}

	.resend-link {
		background: none;
		border: none;
		padding: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		text-decoration: underline;
		cursor: pointer;

		&:hover {
			color: var(--text-primary);
		}

		&:disabled {
			opacity: 0.5;
			cursor: default;
		}
	}

	.resend-message {
		color: var(--text-tertiary);
	}
</style>
