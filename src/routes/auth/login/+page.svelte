<script lang="ts">
	import { enhance } from '$app/forms'
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import SocialLoginButtons from '$lib/components/auth/SocialLoginButtons.svelte'
	import type { SocialProvider } from '$lib/auth/socialProviders'
	import type { SocialErrorCode } from '$lib/auth/socialResult'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		data: {
			socialProviders: SocialProvider[]
			linkProvider: string | null
			socialError: SocialErrorCode | null
			next: string | null
		}
		form: { error?: string; email?: string } | null
	}

	let { data, form }: Props = $props()

	const socialErrorMessages: Record<SocialErrorCode, () => string> = {
		failed: m.auth_social_errors_failed,
		cancelled: m.auth_social_errors_cancelled,
		rate_limited: m.auth_social_errors_rate_limited,
		expired: m.auth_social_errors_expired,
		identity_taken: m.auth_social_errors_failed,
		provider_already_linked: m.auth_social_errors_failed
	}

	const socialErrorMessage = $derived(
		!form && data.socialError ? socialErrorMessages[data.socialError]() : undefined
	)

	let email = $derived(form?.email ?? '')
	let password = $state('')
	let isSubmitting = $state(false)

	const errorMessages: Record<string, () => string> = {
		fields_required: m.auth_login_errors_fieldsRequired,
		failed: m.auth_login_errors_failed
	}

	const errorMessage = $derived(
		form?.error ? (errorMessages[form.error]?.() ?? form.error) : undefined
	)

	const placeholders = ['gran@grancypher.com', 'djeeta@grancypher.com']
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)]
</script>

<PageMeta title={m.page_title_login()} description={m.page_desc_home()} />

<AuthCard title={m.auth_login_title()}>
	{#if data.linkProvider}
		<p class="notice">{m.auth_social_link_prompt({ provider: data.linkProvider })}</p>
	{/if}

	{#if !data.linkProvider}
		<SocialLoginButtons providers={data.socialProviders} next={data.next} />
	{/if}

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
		<Input
			type="email"
			name="email"
			placeholder={m.auth_login_email()}
			bind:value={email}
			autocomplete="email"
			required
			fullWidth
			contained
		/>

		<Input
			type="password"
			name="password"
			placeholder={m.auth_login_password()}
			bind:value={password}
			autocomplete="current-password"
			minlength={8}
			required
			fullWidth
			contained
		/>

		{#if errorMessage ?? socialErrorMessage}
			<p class="error">{errorMessage ?? socialErrorMessage}</p>
		{/if}

		<Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
			{isSubmitting ? m.auth_login_submitting() : m.auth_login_submit()}
		</Button>
	</form>

	{#snippet footer()}
		<p>
			{m.auth_login_noAccount()}
			<a href={localizeHref('/auth/register')}>{m.auth_login_register()}</a>
		</p>
		<p>
			<a href={localizeHref('/auth/forgot-password')}>{m.auth_login_forgotPassword()}</a>
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

	.notice {
		color: var(--text-primary);
		font-size: $font-small;
		text-align: center;
		margin: 0 0 $unit-2x;
		padding: $unit $unit-2x;
		background: var(--button-bg, rgba(128, 128, 128, 0.12));
		border-radius: $unit;
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
