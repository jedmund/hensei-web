<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { env } from '$env/dynamic/public'
	import { createQuery } from '@tanstack/svelte-query'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Button from '../ui/Button.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import { page } from '$app/state'
	import {
		parseSocialProviders,
		SOCIAL_PROVIDERS,
		SOCIAL_PROVIDER_LABELS,
		type SocialProvider
	} from '$lib/auth/socialProviders'
	import { stripSettingsReturn, type SettingsReturn } from '$lib/auth/socialResult'

	interface Props {
		/** The result of a link that just came back from a provider, if any. */
		result?: SettingsReturn | null
	}

	let { result = null }: Props = $props()

	const enabled = parseSocialProviders(env.PUBLIC_SOCIAL_LOGIN_PROVIDERS)

	const identitiesQuery = createQuery(() => ({
		queryKey: ['currentUser', 'identities'],
		queryFn: () => userAdapter.getIdentities(),
		staleTime: 0
	}))

	const identities = $derived(identitiesQuery.data ?? [])

	// Linked providers always show (so they can be unlinked); unlinked ones
	// only when the provider is switched on.
	const rows = $derived(
		SOCIAL_PROVIDERS.filter(
			(p) => enabled.includes(p) || identities.some((i) => i.provider === p)
		).map((provider) => ({
			provider,
			identity: identities.find((i) => i.provider === provider) ?? null
		}))
	)

	let unlinking = $state<SocialProvider | null>(null)
	let message = $state<{ text: string; tone: 'success' | 'error' } | null>(null)

	$effect(() => {
		if (!result?.provider) return
		const provider = SOCIAL_PROVIDER_LABELS[result.provider]
		if (result.linked) {
			message = { text: m.settings_connected_linked({ provider }), tone: 'success' }
			return
		}
		switch (result.error) {
			case 'identity_taken':
				message = { text: m.settings_connected_errors_identity_taken({ provider }), tone: 'error' }
				break
			case 'provider_already_linked':
				message = {
					text: m.settings_connected_errors_provider_already_linked({ provider }),
					tone: 'error'
				}
				break
			case 'cancelled':
				message = { text: m.settings_connected_errors_cancelled({ provider }), tone: 'error' }
				break
			case 'rate_limited':
				message = { text: m.auth_social_errors_rate_limited(), tone: 'error' }
				break
			case null:
				break
			default:
				message = { text: m.settings_connected_errors_failed({ provider }), tone: 'error' }
		}
	})

	function linkHref(provider: SocialProvider): string {
		const here = stripSettingsReturn(page.url)
		const next = here.pathname + here.search
		return `${localizeHref(`/auth/${provider}`)}?mode=link&next=${encodeURIComponent(next)}`
	}

	async function unlink(provider: SocialProvider) {
		const label = SOCIAL_PROVIDER_LABELS[provider]
		unlinking = provider
		message = null
		try {
			await userAdapter.unlinkIdentity(provider)
		} catch (e) {
			// Adapter errors carry the API's JSON body in `details`.
			const err = e as { status?: number; details?: { error?: unknown } } | null
			const code = err?.details?.error
			// 404 means it was already unlinked elsewhere; just refresh.
			if (err?.status !== 404) {
				message = {
					text:
						code === 'last_login_method'
							? m.settings_connected_errors_last_login_method({ provider: label })
							: m.settings_connected_errors_unlink_failed({ provider: label }),
					tone: 'error'
				}
			}
		} finally {
			unlinking = null
			await identitiesQuery.refetch()
		}
	}

	function subtitle(identity: (typeof identities)[number] | null): string {
		if (!identity) return m.settings_connected_not_connected()
		if (identity.isPrivateEmail) return m.settings_connected_hidden_email()
		return identity.email ?? m.settings_connected_connected()
	}
</script>

{#if rows.length > 0}
	<h3 class="section-header">{m.settings_connected_accounts()}</h3>
	<p class="description">{m.settings_connected_accounts_description()}</p>

	{#if message}
		<p class="message {message.tone}" role="status">{message.text}</p>
	{/if}

	{#if identitiesQuery.isError}
		<p class="message error">{m.settings_connected_load_error()}</p>
	{/if}

	{#each rows as row (row.provider)}
		<SettingsRow title={SOCIAL_PROVIDER_LABELS[row.provider]} subtitle={subtitle(row.identity)}>
			{#snippet control()}
				{#if row.identity}
					<Button
						variant="ghost"
						size="small"
						disabled={unlinking !== null}
						onclick={() => unlink(row.provider)}
					>
						{unlinking === row.provider
							? m.settings_connected_unlinking()
							: m.settings_connected_unlink()}
					</Button>
				{:else if enabled.includes(row.provider)}
					<Button
						variant="secondary"
						size="small"
						href={linkHref(row.provider)}
						disabled={identitiesQuery.isPending}
					>
						{m.settings_connected_link()}
					</Button>
				{/if}
			{/snippet}
		</SettingsRow>
	{/each}
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.section-header {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: spacing.$unit-2x 0 0;
	}

	.description {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin: 0;
	}

	.message {
		font-size: typography.$font-small;
		margin: 0;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: spacing.$unit;

		&.success {
			color: var(--text-primary);
			background: var(--button-bg, rgba(128, 128, 128, 0.12));
		}

		&.error {
			color: var(--danger, #d64545);
			background: var(--danger-bg);
		}
	}
</style>
