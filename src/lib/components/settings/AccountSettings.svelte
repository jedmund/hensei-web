
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import Input from '../ui/Input.svelte'
	import Button from '../ui/Button.svelte'
	import Select from '../ui/Select.svelte'
	import Switch from '../ui/switch/Switch.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import ElementPicker from '../ui/element-picker/ElementPicker.svelte'
	import type { ElementType } from '../ui/SettingsNav.svelte'
	import { getElementKey } from '$lib/utils/element'
	import { userAdapter } from '$lib/api/adapters/user.adapter'

	interface Props {
		username: string
		email: string
		emailVerified: boolean
		bahamut: boolean
		role: number
		element: ElementType
		language: string
		theme: string
		currentPassword: string
		newPassword: string
		confirmPassword: string
		onUsernameChange: (value: string) => void
		onEmailChange: (value: string) => void
		onBahamutChange: (value: boolean) => void
		onUsernameValidChange?: (valid: boolean) => void
		onElementChange: (value: string) => void
		onLanguageChange: (value: string) => void
		onThemeChange: (value: string) => void
		onCurrentPasswordChange: (value: string) => void
		onNewPasswordChange: (value: string) => void
		onConfirmPasswordChange: (value: string) => void
	}

	let {
		username,
		email,
		emailVerified,
		bahamut,
		role,
		element,
		language,
		theme,
		currentPassword,
		newPassword,
		confirmPassword,
		onUsernameChange,
		onEmailChange,
		onBahamutChange,
		onUsernameValidChange,
		onElementChange,
		onLanguageChange,
		onThemeChange,
		onCurrentPasswordChange,
		onNewPasswordChange,
		onConfirmPasswordChange
	}: Props = $props()

	// Editing state for read-only fields
	let editingUsername = $state(false)
	let editingEmail = $state(false)

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

	// Local state initialized from props — mutable for form editing
	let localUsername = $state(username)
	let localEmail = $state(email)

	// Capture original username for comparison (prop gets mutated by parent on each keystroke)
	const originalUsername = username

	// Username validation
	const usernameRegex = /^[a-zA-Z0-9_-]+$/
	let usernameError = $state('')
	let isCheckingUsername = $state(false)
	let usernameAvailable = $state<boolean | null>(null)
	let usernameTimer: ReturnType<typeof setTimeout>

	function validateUsername(value: string) {
		if (value === originalUsername) {
			usernameError = ''
			usernameAvailable = null
			onUsernameValidChange?.(true)
			return
		}
		if (value.length < 3) {
			usernameError = m.auth_register_errors_usernameMin()
			usernameAvailable = null
			onUsernameValidChange?.(false)
			return
		}
		if (value.length > 26) {
			usernameError = m.auth_register_errors_usernameMax()
			usernameAvailable = null
			onUsernameValidChange?.(false)
			return
		}
		if (!usernameRegex.test(value)) {
			usernameError = m.auth_register_errors_usernameFormat()
			usernameAvailable = null
			onUsernameValidChange?.(false)
			return
		}
		usernameError = ''
		// Don't set valid yet — wait for availability check to confirm
		onUsernameValidChange?.(false)
	}

	async function checkUsernameAvailability(value: string) {
		if (value.length < 3 || !usernameRegex.test(value) || value === originalUsername) return

		isCheckingUsername = true
		try {
			const result = await userAdapter.checkUsernameAvailability(value)
			if (localUsername === value) {
				usernameAvailable = result.available
				if (!result.available) {
					usernameError = m.auth_register_errors_usernameTaken()
					onUsernameValidChange?.(false)
				} else {
					onUsernameValidChange?.(true)
				}
			}
		} catch {
			// If availability check fails, allow save — backend will validate
			onUsernameValidChange?.(true)
		} finally {
			isCheckingUsername = false
		}
	}

	const usernameIcon = $derived(
		localUsername === originalUsername
			? undefined
			: isCheckingUsername
				? 'loader'
				: usernameAvailable === true
					? 'check'
					: usernameAvailable === false
						? 'close'
						: undefined
	)

	// Propagate changes back to parent
	function handleUsernameInput() {
		usernameAvailable = null
		clearTimeout(usernameTimer)
		validateUsername(localUsername)
		onUsernameChange(localUsername)

		if (localUsername !== originalUsername && localUsername.length >= 3 && !usernameError) {
			usernameTimer = setTimeout(() => checkUsernameAvailability(localUsername), 300)
		}
	}
	function handleEmailInput() {
		onEmailChange(localEmail)
	}

	// Check if user is admin
	const isAdmin = $derived(role === 9)

	// Element key ↔ numeric ID conversion
	const ELEMENT_KEY_TO_ID: Record<string, number> = {
		wind: 1, fire: 2, water: 3, earth: 4, dark: 5, light: 6
	}
	const elementId = $derived(ELEMENT_KEY_TO_ID[element] ?? 1)

	// Language/Theme local state
	let localLanguage = $derived(language)
	let localTheme = $derived(theme)

	$effect(() => {
		if (localLanguage !== language) onLanguageChange(localLanguage)
	})
	$effect(() => {
		if (localTheme !== theme) onThemeChange(localTheme)
	})

	const languageOptions = [
		{ value: 'en', label: 'English' },
		{ value: 'ja', label: '日本語' }
	]

	const themeOptions = [
		{ value: 'system', label: m.settings_theme_system() },
		{ value: 'light', label: m.settings_theme_light() },
		{ value: 'dark', label: m.settings_theme_dark() }
	]

	// Password local state
	let localCurrentPassword = $state(currentPassword)
	let localNewPassword = $state(newPassword)
	let localConfirmPassword = $state(confirmPassword)

	function handleCurrentPasswordInput() {
		onCurrentPasswordChange(localCurrentPassword)
	}
	function handleNewPasswordInput() {
		onNewPasswordChange(localNewPassword)
	}
	function handleConfirmPasswordInput() {
		onConfirmPasswordChange(localConfirmPassword)
	}

	const hasSecurityChanges = $derived(localNewPassword !== '' || localConfirmPassword !== '')
	const passwordsMatch = $derived(localNewPassword === '' || localNewPassword === localConfirmPassword)
	const passwordError = $derived(!passwordsMatch ? m.settings_password_mismatch() : '')
	const currentPasswordRequired = $derived(hasSecurityChanges && localCurrentPassword === '')
</script>

<div class="section">
	<div class="form-fields">
		<!-- Username -->
		{#if editingUsername}
			<Input
				label={m.settings_username()}
				placeholder={m.settings_username_placeholder()}
				contained
				fullWidth
				bind:value={localUsername}
				handleInput={handleUsernameInput}
				error={usernameError}
				rightIcon={usernameIcon}
			/>
		{:else}
			<div class="readonly-row">
				<div class="readonly-field">
					<span class="field-label">{m.settings_username()}</span>
					<span class="field-value">{username}</span>
				</div>
				<Button variant="text" size="small" onclick={() => (editingUsername = true)}>
					{m.action_change()}
				</Button>
			</div>
		{/if}

		<!-- Email -->
		{#if editingEmail}
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
		{:else}
			<div class="readonly-row">
				<div class="readonly-field">
					<span class="field-label">{m.settings_email()}</span>
					<span class="field-value">{email}</span>
				</div>
				<Button variant="text" size="small" onclick={() => (editingEmail = true)}>
					{m.action_change()}
				</Button>
			</div>
		{/if}

		<!-- Element Selection -->
		<SettingsRow title={m.settings_element()} subtitle={m.settings_element_subtitle()}>
			{#snippet control()}
				<ElementPicker
					value={elementId}
					onValueChange={(v) => {
						const key = getElementKey(v as number)
						onElementChange(key)
					}}
					mode="dropdown"
					contained
				/>
			{/snippet}
		</SettingsRow>

		<!-- Language Selection -->
		<SettingsRow title={m.settings_language()} subtitle={m.settings_language_subtitle()}>
			{#snippet control()}
				<Select
					bind:value={localLanguage}
					options={languageOptions}
					placeholder={m.settings_language_placeholder()}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<!-- Theme Selection -->
		<SettingsRow title={m.settings_theme()} subtitle={m.settings_theme_subtitle()}>
			{#snippet control()}
				<Select
					bind:value={localTheme}
					options={themeOptions}
					placeholder={m.settings_theme_placeholder()}
					contained
					portal
				/>
			{/snippet}
		</SettingsRow>

		<!-- Bahamut Mode (admin only) -->
		{#if isAdmin}
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

		<!-- Password Section -->
		<h3 class="section-header">{m.settings_nav_password()}</h3>

		<p class="section-note">
			{m.settings_password_note()}
		</p>

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

		<Input
			label={m.settings_new_password()}
			type="password"
			placeholder={m.settings_new_password_placeholder()}
			contained
			fullWidth
			bind:value={localNewPassword}
			handleInput={handleNewPasswordInput}
		/>

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

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.section-header {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: 0;
	}

	.readonly-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit-2x;
	}

	.readonly-field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.field-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.field-value {
		font-size: typography.$font-regular;
		color: var(--text-primary);
	}

	.section-note {
		font-size: typography.$font-small;
		color: var(--text-secondary);
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
