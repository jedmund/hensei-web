<script lang="ts">
	import { enhance } from '$app/forms'
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		form: { error?: string; email?: string } | null
	}

	let { form }: Props = $props()

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
	const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)]
</script>

<PageMeta title={m.page_title_login()} description={m.page_desc_home()} />

<AuthCard title={m.auth_login_title()}>
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

		{#if errorMessage}
			<p class="error">{errorMessage}</p>
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
