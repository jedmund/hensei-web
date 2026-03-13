<script lang="ts">
	import { enhance } from '$app/forms'
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		form: {
			error?: string
			details?: { fieldErrors?: Record<string, string[]> }
			username?: string
			email?: string
		} | null
	}

	let { form }: Props = $props()

	let username = $state(form?.username ?? '')
	let email = $state(form?.email ?? '')
	let password = $state('')
	let passwordConfirmation = $state('')
	let isSubmitting = $state(false)

	// Validation states
	let usernameError = $state('')
	let emailError = $state('')
	let passwordError = $state('')
	let passwordConfirmationError = $state('')

	let isCheckingUsername = $state(false)
	let isCheckingEmail = $state(false)
	let usernameAvailable = $state<boolean | null>(null)
	let emailAvailable = $state<boolean | null>(null)

	// Debounce timers
	let usernameTimer: ReturnType<typeof setTimeout>
	let emailTimer: ReturnType<typeof setTimeout>

	// Username validation regex
	const usernameRegex = /^[a-zA-Z0-9_-]+$/
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

	// Computed validation
	const isFormValid = $derived(
		username.length >= 3 &&
			username.length <= 20 &&
			usernameRegex.test(username) &&
			usernameAvailable === true &&
			emailRegex.test(email) &&
			emailAvailable === true &&
			password.length >= 8 &&
			passwordConfirmation === password &&
			!usernameError &&
			!emailError &&
			!passwordError &&
			!passwordConfirmationError
	)

	function validateUsername(value: string) {
		if (value.length === 0) {
			usernameError = ''
			usernameAvailable = null
			return
		}
		if (value.length < 3) {
			usernameError = m.auth_register_errors_usernameMin()
			usernameAvailable = null
			return
		}
		if (value.length > 20) {
			usernameError = m.auth_register_errors_usernameMax()
			usernameAvailable = null
			return
		}
		if (!usernameRegex.test(value)) {
			usernameError = m.auth_register_errors_usernameFormat()
			usernameAvailable = null
			return
		}
		usernameError = ''
	}

	function validateEmail(value: string) {
		if (value.length === 0) {
			emailError = ''
			emailAvailable = null
			return
		}
		if (!emailRegex.test(value)) {
			emailError = m.auth_register_errors_emailInvalid()
			emailAvailable = null
			return
		}
		emailError = ''
	}

	function validatePassword(value: string) {
		if (value.length === 0) {
			passwordError = ''
			return
		}
		if (value.length < 8) {
			passwordError = m.auth_register_errors_passwordMin()
			return
		}
		passwordError = ''
	}

	function validatePasswordConfirmation(value: string, original: string) {
		if (value.length === 0) {
			passwordConfirmationError = ''
			return
		}
		if (value !== original) {
			passwordConfirmationError = m.auth_register_errors_passwordMismatch()
			return
		}
		passwordConfirmationError = ''
	}

	async function checkUsernameAvailability(value: string) {
		if (value.length < 3 || !usernameRegex.test(value)) return

		isCheckingUsername = true
		try {
			const result = await userAdapter.checkUsernameAvailability(value)
			// Only update if the value hasn't changed
			if (username === value) {
				usernameAvailable = result.available
				if (!result.available) {
					usernameError = m.auth_register_errors_usernameTaken()
				}
			}
		} catch {
			// Silently fail availability check
		} finally {
			isCheckingUsername = false
		}
	}

	async function checkEmailAvailability(value: string) {
		if (!emailRegex.test(value)) return

		isCheckingEmail = true
		try {
			const result = await userAdapter.checkEmailAvailability(value)
			// Only update if the value hasn't changed
			if (email === value) {
				emailAvailable = result.available
				if (!result.available) {
					emailError = m.auth_register_errors_emailTaken()
				}
			}
		} catch {
			// Silently fail availability check
		} finally {
			isCheckingEmail = false
		}
	}

	function onUsernameInput(e: Event) {
		const target = e.target as HTMLInputElement
		username = target.value
		usernameAvailable = null

		clearTimeout(usernameTimer)
		validateUsername(username)

		if (username.length >= 3 && !usernameError) {
			usernameTimer = setTimeout(() => checkUsernameAvailability(username), 300)
		}
	}

	function onEmailInput(e: Event) {
		const target = e.target as HTMLInputElement
		email = target.value
		emailAvailable = null

		clearTimeout(emailTimer)
		validateEmail(email)

		if (emailRegex.test(email) && !emailError) {
			emailTimer = setTimeout(() => checkEmailAvailability(email), 300)
		}
	}

	function onPasswordInput(e: Event) {
		const target = e.target as HTMLInputElement
		password = target.value
		validatePassword(password)
		// Re-validate confirmation if it has content
		if (passwordConfirmation.length > 0) {
			validatePasswordConfirmation(passwordConfirmation, password)
		}
	}

	function onPasswordConfirmationInput(e: Event) {
		const target = e.target as HTMLInputElement
		passwordConfirmation = target.value
		validatePasswordConfirmation(passwordConfirmation, password)
	}

	// Derive validation icon states
	const usernameIcon = $derived(
		isCheckingUsername
			? 'loader'
			: usernameAvailable === true
				? 'check'
				: usernameAvailable === false
					? 'x'
					: undefined
	)

	const emailIcon = $derived(
		isCheckingEmail
			? 'loader'
			: emailAvailable === true
				? 'check'
				: emailAvailable === false
					? 'x'
					: undefined
	)
</script>

<PageMeta title={m.page_title_register()} description={m.page_desc_home()} />

<AuthCard title={m.auth_register_title()}>
	<form
		method="post"
		use:enhance={() => {
			isSubmitting = true
			return async ({ update }) => {
				isSubmitting = false
				await update()
			}
		}}
	>
		<section class="input-group">
			<Input
				type="text"
				name="username"
				placeholder={m.auth_register_username()}
				value={username}
				oninput={onUsernameInput}
				minlength={3}
				maxLength={20}
				required
				fullWidth
				contained
				error={usernameError}
				rightIcon={usernameIcon}
				no1password
			/>
			<span class="note">{m.auth_register_usernameNote()}</span>
		</section>

		<section class="input-group">
			<Input
				type="email"
				name="email"
				placeholder={m.auth_register_email()}
				value={email}
				oninput={onEmailInput}
				autocomplete="email"
				required
				fullWidth
				contained
				error={emailError}
				rightIcon={emailIcon}
			/>

			<Input
				type="password"
				name="password"
				placeholder={m.auth_register_password()}
				value={password}
				oninput={onPasswordInput}
				autocomplete="new-password"
				minlength={8}
				required
				fullWidth
				contained
				error={passwordError}
			/>

			<Input
				type="password"
				name="password_confirmation"
				placeholder={m.auth_register_confirmPassword()}
				value={passwordConfirmation}
				oninput={onPasswordConfirmationInput}
				autocomplete="new-password"
				required
				fullWidth
				contained
				error={passwordConfirmationError}
			/>
		</section>

		{#if form?.error}
			<p class="error">{form.error}</p>
		{/if}

		<Button type="submit" variant="primary" fullWidth disabled={isSubmitting || !isFormValid}>
			{isSubmitting ? m.auth_register_submitting() : m.auth_register_submit()}
		</Button>
	</form>

	{#snippet footer()}
		<p>
			{m.auth_register_hasAccount()}
			<a href={localizeHref('/auth/login')}>{m.auth_register_login()}</a>
		</p>
	{/snippet}
</AuthCard>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	form {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: $unit;

		.note {
			color: var(--text-secondary);
			font-size: $font-small;
			text-align: center;
			margin: 0;
		}
	}

	.error {
		color: $error;
		font-size: $font-small;
		text-align: center;
		margin: 0;
		padding: $unit $unit-2x;
		background: var(--danger-bg);
		border-radius: $unit;
	}
</style>
