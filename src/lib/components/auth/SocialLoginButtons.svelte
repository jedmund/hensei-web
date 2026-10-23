<script lang="ts">
	import type { SocialProvider } from '$lib/auth/socialProviders'
	import { SOCIAL_PROVIDER_LABELS } from '$lib/auth/socialProviders'
	import Button from '$lib/components/ui/Button.svelte'
	import ProviderLogo from './ProviderLogo.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	interface Props {
		providers: SocialProvider[]
		/** Where to land after signing in (passed through as ?next=). */
		next?: string | null
	}

	let { providers, next = null }: Props = $props()

	// Plain links, not forms: the CSP's form-action would block a form that
	// redirects to the provider.
	function hrefFor(provider: SocialProvider): string {
		const path = localizeHref(`/auth/${provider}`)
		return next ? `${path}?next=${encodeURIComponent(next)}` : path
	}
</script>

{#if providers.length > 0}
	<div class="social">
		<div class="buttons">
			{#each providers as provider (provider)}
				<Button
					href={hrefFor(provider)}
					variant="secondary"
					contained
					class="provider"
					aria-label={m.auth_social_continueWith({ provider: SOCIAL_PROVIDER_LABELS[provider] })}
					title={m.auth_social_continueWith({ provider: SOCIAL_PROVIDER_LABELS[provider] })}
					data-sveltekit-reload
					data-sveltekit-preload-data="off"
				>
					<ProviderLogo {provider} size={20} />
				</Button>
			{/each}
		</div>
		<div class="divider"><span>{m.auth_social_divider()}</span></div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.social {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		margin-bottom: $unit-3x;
	}

	.buttons {
		display: flex;
		gap: $unit;

		// One equal-width button per provider, in a row.
		:global(.provider) {
			flex: 1;
		}
	}

	.divider {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		color: var(--text-secondary);
		font-size: $font-small;

		&::before,
		&::after {
			content: '';
			flex: 1;
			height: 1px;
			background: var(--separator-bg, rgba(128, 128, 128, 0.3));
		}
	}
</style>
