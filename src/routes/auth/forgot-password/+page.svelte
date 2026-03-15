<script lang="ts">
	import { enhance } from '$app/forms'
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		form: { error?: string; email?: string; success?: boolean } | null
	}

	let { form }: Props = $props()

	let email = $state(form?.email ?? '')
	let isSubmitting = $state(false)
</script>

<PageMeta title={m.auth_forgotPassword_title()} description={m.page_desc_home()} />

<AuthCard title={m.auth_forgotPassword_title()}>
	{#if form?.success}
		<p class="success">{m.auth_forgotPassword_success()}</p>
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
			<Input
				type="email"
				name="email"
				placeholder={m.auth_forgotPassword_email()}
				bind:value={email}
				autocomplete="email"
				required
				fullWidth
				contained
			/>

			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}

			<Button type="submit" variant="primary" fullWidth disabled={isSubmitting}>
				{isSubmitting ? m.auth_forgotPassword_submitting() : m.auth_forgotPassword_submit()}
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
</style>
