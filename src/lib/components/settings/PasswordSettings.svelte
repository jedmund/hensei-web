
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Input from '../ui/Input.svelte'

	interface Props {
		currentPassword: string
		newPassword: string
		confirmPassword: string
		onCurrentPasswordChange: (value: string) => void
		onNewPasswordChange: (value: string) => void
		onConfirmPasswordChange: (value: string) => void
	}

	let {
		currentPassword,
		newPassword,
		confirmPassword,
		onCurrentPasswordChange,
		onNewPasswordChange,
		onConfirmPasswordChange
	}: Props = $props()

	// Local state derived from props — overrides via bind:value are temporary
	let localCurrentPassword = $derived(currentPassword)
	let localNewPassword = $derived(newPassword)
	let localConfirmPassword = $derived(confirmPassword)

	// Propagate changes back to parent
	function handleCurrentPasswordInput() {
		onCurrentPasswordChange(localCurrentPassword)
	}
	function handleNewPasswordInput() {
		onNewPasswordChange(localNewPassword)
	}
	function handleConfirmPasswordInput() {
		onConfirmPasswordChange(localConfirmPassword)
	}

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
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

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
</style>
