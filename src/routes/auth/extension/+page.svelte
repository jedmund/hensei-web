<script lang="ts">
	import { page } from '$app/state'
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		data: {
			username: string
			params: Record<string, string>
			cancelUrl: string
		}
	}

	let { data }: Props = $props()

	let isSubmitting = $state(false)
	let error = $state<'failed' | 'rate_limited' | null>(null)

	const errorMessage = $derived(
		error === 'rate_limited'
			? m.auth_extension_errors_rateLimited()
			: error === 'failed'
				? m.auth_extension_errors_failed()
				: undefined
	)

	// A fetch and then location.assign() rather than a form: the CSP's
	// form-action would block a form submission that redirects to the
	// extension's chromiumapp.org URL.
	async function handleContinue() {
		isSubmitting = true
		error = null
		try {
			const res = await fetch('/auth/extension/code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data.params)
			})
			const body = (await res.json().catch(() => ({}))) as { url?: unknown }
			if (res.ok && typeof body.url === 'string') {
				// Leave the button disabled: the extension closes this window.
				window.location.assign(body.url)
				return
			}
			if (res.status === 401) {
				// Logged out (or the session expired): reloading goes to the login page.
				window.location.reload()
				return
			}
			error = res.status === 429 ? 'rate_limited' : 'failed'
		} catch {
			error = 'failed'
		}
		isSubmitting = false
	}

	// Log out, then load this page again, which sends the user to log in and back.
	async function handleSwitchAccount(event: MouseEvent) {
		event.preventDefault()
		try {
			await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
		} finally {
			window.location.reload()
		}
	}
</script>

<PageMeta title={m.auth_extension_title()} description={m.page_desc_home()} />

<AuthCard title={m.auth_extension_title()}>
	<p class="intro">{m.auth_extension_prompt({ username: data.username })}</p>

	{#if errorMessage}
		<p class="error">{errorMessage}</p>
	{/if}

	<Button variant="primary" fullWidth disabled={isSubmitting} onclick={handleContinue}>
		{isSubmitting ? m.auth_extension_submitting() : m.auth_extension_continue()}
	</Button>
	<Button variant="secondary" fullWidth href={data.cancelUrl} data-sveltekit-reload>
		{m.auth_extension_cancel()}
	</Button>

	{#snippet footer()}
		<p>
			{m.auth_extension_notYou()}
			<a href={`${page.url.pathname}${page.url.search}`} onclick={handleSwitchAccount}
				>{m.auth_extension_switchAccount()}</a
			>
		</p>
	{/snippet}
</AuthCard>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;

	.intro {
		color: var(--text-secondary);
		font-size: $font-regular;
		text-align: center;
		margin: 0;
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
