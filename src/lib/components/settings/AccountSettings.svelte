
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
		currentPassword: string
		newPassword: string
		confirmPassword: string
		bahamut: boolean
		role: number
		element: ElementType
		onUsernameChange: (value: string) => void
		onEmailChange: (value: string) => void
		onCurrentPasswordChange: (value: string) => void
		onNewPasswordChange: (value: string) => void
		onConfirmPasswordChange: (value: string) => void
		onBahamutChange: (value: boolean) => void
	}

	let {
		username,
		email,
		emailVerified,
		currentPassword,
		newPassword,
		confirmPassword,
		bahamut,
		role,
		element,
		onUsernameChange,
		onEmailChange,
		onCurrentPasswordChange,
		onNewPasswordChange,
		onConfirmPasswordChange,
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

	// Local state for inputs
	let localUsername = $state(username)
	let localEmail = $state(email)
	let localCurrentPassword = $state(currentPassword)
	let localNewPassword = $state(newPassword)
	let localConfirmPassword = $state(confirmPassword)

	// Sync local state with props when props change
	$effect(() => {
		localUsername = username
	})
	$effect(() => {
		localEmail = email
	})
	$effect(() => {
		localCurrentPassword = currentPassword
	})
	$effect(() => {
		localNewPassword = newPassword
	})
	$effect(() => {
		localConfirmPassword = confirmPassword
	})

	// Propagate changes back to parent
	function handleUsernameInput() {
		onUsernameChange(localUsername)
	}
	function handleEmailInput() {
		onEmailChange(localEmail)
	}
	function handleCurrentPasswordInput() {
		onCurrentPasswordChange(localCurrentPassword)
	}
	function handleNewPasswordInput() {
		onNewPasswordChange(localNewPassword)
	}
	function handleConfirmPasswordInput() {
		onConfirmPasswordChange(localConfirmPassword)
	}

	// Check if user is admin
	const isAdmin = $derived(role === 9)

	// Check if any sensitive field has been modified
	const hasSecurityChanges = $derived(localNewPassword !== '' || localConfirmPassword !== '')

	// Password match validation
	const passwordsMatch = $derived(localNewPassword === '' || localNewPassword === localConfirmPassword)
	const passwordError = $derived(!passwordsMatch ? m.settings_password_mismatch() : '')

	// Current password required when changing password
	const currentPasswordRequired = $derived(hasSecurityChanges && localCurrentPassword === '')
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

		<hr class="separator" />

		<p class="section-note">
			{m.settings_password_note()}
		</p>

		<!-- Current Password (required for changes) -->
		<Input
			label={m.settings_current_password()}
			type="password"
			placeholder={m.settings_current_password_placeholder()}
			contained
			fullWidth
			required={hasSecurityChanges}
			error={currentPasswordRequired ? m.settings_current_password_required() : ''}
			bind:value={localCurrentPassword}
			handleInput={handleCurrentPasswordInput}
		/>

		<!-- New Password -->
		<Input
			label={m.settings_new_password()}
			type="password"
			placeholder={m.settings_new_password_placeholder()}
			contained
			fullWidth
			bind:value={localNewPassword}
			handleInput={handleNewPasswordInput}
		/>

		<!-- Confirm Password -->
		<Input
			label={m.settings_confirm_password()}
			type="password"
			placeholder={m.settings_confirm_password_placeholder()}
			contained
			fullWidth
			error={passwordError}
			bind:value={localConfirmPassword}
			handleInput={handleConfirmPasswordInput}
		/>

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
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;

	.section {
		display: flex;
		flex-direction: column;
	}

	.section-note {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.separator {
		border: none;
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.08));
		margin: 0;
	}

	.email-group {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
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
