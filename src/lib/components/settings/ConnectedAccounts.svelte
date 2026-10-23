<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { env } from '$env/dynamic/public'
	import { createQuery } from '@tanstack/svelte-query'
	import { localizeHref } from '$lib/paraglide/runtime'
	import Button from '../ui/Button.svelte'
	import SettingsRow from '../ui/SettingsRow.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import { page } from '$app/state'
	import { toast } from 'svelte-sonner'
	import ProviderLogo from '../auth/ProviderLogo.svelte'
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

	// A link that just came back from the provider is reported as a toast.
	// Each result object is reported once.
	let reported: SettingsReturn | null = null

	$effect(() => {
		if (!result?.provider || result === reported) return
		reported = result
		const provider = SOCIAL_PROVIDER_LABELS[result.provider]
		if (result.linked) {
			toast.success(m.settings_connected_linked({ provider }))
			return
		}
		switch (result.error) {
			case 'identity_taken':
				toast.error(m.settings_connected_errors_identity_taken({ provider }))
				break
			case 'provider_already_linked':
				toast.error(m.settings_connected_errors_provider_already_linked({ provider }))
				break
			case 'cancelled':
				toast.error(m.settings_connected_errors_cancelled({ provider }))
				break
			case 'rate_limited':
				toast.error(m.auth_social_errors_rate_limited())
				break
			case null:
				break
			default:
				toast.error(m.settings_connected_errors_failed({ provider }))
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
		try {
			await userAdapter.unlinkIdentity(provider)
		} catch (e) {
			// Adapter errors carry the API's JSON body in `details`.
			const err = e as { status?: number; details?: { error?: unknown } } | null
			const code = err?.details?.error
			// 404 means it was already unlinked elsewhere; just refresh.
			if (err?.status !== 404) {
				toast.error(
					code === 'last_login_method'
						? m.settings_connected_errors_last_login_method({ provider: label })
						: m.settings_connected_errors_unlink_failed({ provider: label })
				)
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

	{#each rows as row (row.provider)}
		<SettingsRow title={SOCIAL_PROVIDER_LABELS[row.provider]} subtitle={subtitle(row.identity)}>
			{#snippet icon()}
				<ProviderLogo provider={row.provider} size={20} brandColor />
			{/snippet}
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
</style>
