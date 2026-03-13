
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Input from '../ui/Input.svelte'
	import Switch from '../ui/switch/Switch.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import type { ElementType } from '../ui/SettingsNav.svelte'

	interface Props {
		username: string
		email: string
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
		<Input
			label={m.settings_email()}
			type="email"
			placeholder={m.settings_email_placeholder()}
			contained
			fullWidth
			bind:value={localEmail}
			handleInput={handleEmailInput}
		/>

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
</style>
