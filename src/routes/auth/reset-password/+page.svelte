<script lang="ts">
	import { enhance } from '$app/forms'
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		data: { email?: string; token?: string; invalidToken?: boolean }
		form: { error?: string; success?: boolean; invalidToken?: boolean } | null
	}

	let { data, form }: Props = $props()

	let password = $state('')
	let passwordConfirmation = $state('')
	let isSubmitting = $state(false)

	const errorMessages: Record<string, () => string> = {
		fields_required: m.auth_resetPassword_errors_fieldsRequired,
		password_min: m.auth_resetPassword_errors_passwordMin,
		password_mismatch: m.auth_resetPassword_errors_passwordMismatch,
		failed: m.auth_resetPassword_errors_failed
	}

	const errorMessage = $derived(
		form?.error ? (errorMessages[form.error]?.() ?? form.error) : undefined
	)

	let passwordError = $state('')
	let passwordConfirmationError = $state('')

	const isFormValid = $derived(
		password.length >= 8 &&
			passwordConfirmation === password &&
			!passwordError &&
			!passwordConfirmationError
	)

	function validatePassword(value: string) {
		if (value.length === 0) {
			passwordError = ''
			return
		}
		if (value.length < 8) {
			passwordError = m.auth_resetPassword_errors_passwordMin()
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
			passwordConfirmationError = m.auth_resetPassword_errors_passwordMismatch()
			return
		}
		passwordConfirmationError = ''
	}

	function onPasswordInput(e: Event) {
		const target = e.target as HTMLInputElement
		password = target.value
		validatePassword(password)
		if (passwordConfirmation.length > 0) {
			validatePasswordConfirmation(passwordConfirmation, password)
		}
	}

	function onPasswordConfirmationInput(e: Event) {
		const target = e.target as HTMLInputElement
		passwordConfirmation = target.value
		validatePasswordConfirmation(passwordConfirmation, password)
	}
</script>

<PageMeta title={m.auth_resetPassword_title()} description={m.page_desc_home()} />

<AuthCard title={m.auth_resetPassword_title()}>
	{#if form?.success}
		<p class="success">{m.auth_resetPassword_success()}</p>
		<a href={localizeHref('/auth/login')} class="action-link">
			{m.auth_resetPassword_signIn()}
		</a>
	{:else if data.invalidToken || form?.invalidToken}
		<p class="error">{m.auth_resetPassword_invalidToken()}</p>
		<a href={localizeHref('/auth/forgot-password')} class="action-link">
			{m.auth_resetPassword_requestNew()}
		</a>
	{:else}
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
			<input type="hidden" name="email" value={data.email} />
			<input type="hidden" name="token" value={data.token} />

			<Input
				type="password"
				name="password"
				placeholder={m.auth_resetPassword_password()}
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
				placeholder={m.auth_resetPassword_confirmPassword()}
				value={passwordConfirmation}
				oninput={onPasswordConfirmationInput}
				autocomplete="new-password"
				required
				fullWidth
				contained
				error={passwordConfirmationError}
			/>

			{#if errorMessage}
				<p class="error">{errorMessage}</p>
			{/if}

			<Button type="submit" variant="primary" fullWidth disabled={isSubmitting || !isFormValid}>
				{isSubmitting ? m.auth_resetPassword_submitting() : m.auth_resetPassword_submit()}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		<p>
			<a href={localizeHref('/auth/login')}>{m.auth_forgotPassword_backToLogin()}</a>
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
		gap: $unit-2x;
	}

	.success {
		color: var(--text-primary);
		font-size: $font-small;
		text-align: center;
		margin: 0;
		padding: $unit-2x;
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

	.action-link {
		display: block;
		text-align: center;
		color: var(--accent-blue);
		text-decoration: none;
		font-size: $font-small;
		margin-top: $unit;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
