<script lang="ts">
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		data: { success?: boolean; invalidToken?: boolean }
	}

	let { data }: Props = $props()
</script>

<PageMeta title={m.auth_verifyEmail_title()} description={m.page_desc_home()} />

<AuthCard title={m.auth_verifyEmail_title()}>
	{#if data.success}
		<p class="success">{m.auth_verifyEmail_success()}</p>
		<a href={localizeHref('/auth/login')} class="action-link">
			{m.auth_verifyEmail_signIn()}
		</a>
	{:else}
		<p class="error">{m.auth_verifyEmail_invalidToken()}</p>
		<a href={localizeHref('/auth/login')} class="action-link">
			{m.auth_verifyEmail_signIn()}
		</a>
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
