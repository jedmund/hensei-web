<script lang="ts">
	import { enhance } from '$app/forms'
	import { untrack } from 'svelte'
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		data: {
			providerLabel: string
			suggestedUsername: string
			emailRequired: boolean
		}
		form: {
			error?: 'invalid' | 'validation' | 'failed' | 'rate_limited'
			messages?: string[]
			username?: string
			email?: string
		} | null
	}

	let { data, form }: Props = $props()

	let username = $state(untrack(() => form?.username ?? data.suggestedUsername))
	let email = $state(untrack(() => form?.email ?? ''))
	let isSubmitting = $state(false)

	const usernameRegex = /^[a-zA-Z0-9_-]+$/
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

	let usernameError = $state('')
	let usernameAvailable = $state<boolean | null>(null)
	let isCheckingUsername = $state(false)
	let usernameTimer: ReturnType<typeof setTimeout> | undefined

	function validateUsername(value: string): boolean {
		if (value.length < 3) usernameError = m.auth_register_errors_usernameMin()
		else if (value.length > 26) usernameError = m.auth_register_errors_usernameMax()
		else if (!usernameRegex.test(value)) usernameError = m.auth_register_errors_usernameFormat()
		else usernameError = ''
		return usernameError === ''
	}

	async function checkAvailability(value: string) {
		isCheckingUsername = true
		try {
			const result = await userAdapter.checkUsernameAvailability(value)
			if (username === value) {
				usernameAvailable = result.available
				if (!result.available) usernameError = m.auth_register_errors_usernameTaken()
			}
		} catch {
			// The API validates again on submit.
		} finally {
			isCheckingUsername = false
		}
	}

	function scheduleCheck() {
		usernameAvailable = null
		clearTimeout(usernameTimer)
		if (validateUsername(username)) {
			const value = username
			usernameTimer = setTimeout(() => checkAvailability(value), 300)
		}
	}

	// Check the pre-filled suggestion once on load.
	$effect(() => {
		untrack(() => {
			if (username) scheduleCheck()
		})
		return () => clearTimeout(usernameTimer)
	})

	const usernameIcon = $derived(
		isCheckingUsername
			? 'loader'
			: usernameAvailable === true
				? 'check'
				: usernameAvailable === false
					? 'x'
					: undefined
	)

	const emailError = $derived(
		email.length > 0 && !emailRegex.test(email) ? m.auth_register_errors_emailInvalid() : ''
	)

	const isFormValid = $derived(
		username.length >= 3 &&
			username.length <= 26 &&
			usernameRegex.test(username) &&
			usernameAvailable !== false &&
			(!data.emailRequired || emailRegex.test(email))
	)

	const errorMessage = $derived.by(() => {
		switch (form?.error) {
			case 'invalid':
			case 'validation':
				return m.auth_social_username_errors_validation()
			case 'rate_limited':
				return m.auth_social_errors_rate_limited()
			case 'failed':
				return m.auth_social_username_errors_failed()
			default:
				return undefined
		}
	})
</script>

<PageMeta title={m.auth_social_username_title()} description={m.page_desc_home()} />

<AuthCard title={m.auth_social_username_title()} legalConsent>
	<form
		method="post"
		use:enhance={() => {
			isSubmitting = true
			return async ({ update }) => {
				isSubmitting = false
				await update({ reset: false })
			}
		}}
	>
		<p class="intro">{m.auth_social_username_intro({ provider: data.providerLabel })}</p>

		<section class="input-group">
			<Input
				type="text"
				name="username"
				placeholder={m.auth_register_username()}
				bind:value={username}
				handleInput={scheduleCheck}
				minlength={3}
				maxLength={26}
				required
				fullWidth
				contained
				error={usernameError}
				rightIcon={usernameIcon}
				no1password
			/>
			<span class="note">{m.auth_register_usernameNote()}</span>
		</section>

		{#if data.emailRequired}
			<section class="input-group">
				<span class="note"
					>{m.auth_social_username_emailNote({ provider: data.providerLabel })}</span
				>
				<Input
					type="email"
					name="email"
					placeholder={m.auth_register_email()}
					bind:value={email}
					autocomplete="email"
					required
					fullWidth
					contained
					error={emailError}
				/>
			</section>
		{/if}

		{#if errorMessage}
			<div class="error">
				<p>{errorMessage}</p>
				{#if form?.messages?.length}
					<ul>
						{#each form.messages as message (message)}
							<li>{message}</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}

		<Button type="submit" variant="primary" fullWidth disabled={isSubmitting || !isFormValid}>
			{isSubmitting ? m.auth_social_username_submitting() : m.auth_social_username_submit()}
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
		gap: $unit-3x;
	}

	.intro {
		color: var(--text-secondary);
		font-size: $font-regular;
		text-align: center;
		margin: 0;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.note {
		color: var(--text-secondary);
		font-size: $font-small;
		text-align: center;
		margin: 0;
	}

	.error {
		color: $error;
		font-size: $font-small;
		text-align: center;
		padding: $unit $unit-2x;
		background: var(--danger-bg);
		border-radius: $unit;

		p,
		ul {
			margin: 0;
		}

		ul {
			padding: 0;
			list-style: none;
		}
	}
</style>
