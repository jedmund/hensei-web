<script lang="ts">
	import type { SocialProvider } from '$lib/auth/socialProviders'
	import { SOCIAL_PROVIDER_LABELS } from '$lib/auth/socialProviders'
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
		<div class="divider"><span>{m.auth_social_divider()}</span></div>
		<div class="buttons">
			{#each providers as provider (provider)}
				<a
					class="provider {provider}"
					href={hrefFor(provider)}
					data-sveltekit-reload
					data-sveltekit-preload-data="off"
				>
					<span class="logo" aria-hidden="true">
						{#if provider === 'discord'}
							<svg viewBox="0 0 24 24" width="20" height="20">
								<path
									fill="currentColor"
									d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.11 13.11 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
								/>
							</svg>
						{:else if provider === 'google'}
							<svg viewBox="0 0 48 48" width="18" height="18">
								<path
									fill="#EA4335"
									d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
								/>
								<path
									fill="#4285F4"
									d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
								/>
								<path
									fill="#FBBC05"
									d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
								/>
								<path
									fill="#34A853"
									d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
								/>
							</svg>
						{:else}
							<svg viewBox="0 0 24 24" width="18" height="18">
								<path
									fill="currentColor"
									d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
								/>
							</svg>
						{/if}
					</span>
					<span class="label">
						{m.auth_social_continueWith({ provider: SOCIAL_PROVIDER_LABELS[provider] })}
					</span>
				</a>
			{/each}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.social {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		margin-top: $unit-3x;
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

	.buttons {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	// Each provider's own button rules: Discord blurple with the white Clyde
	// mark; Google's light/dark neutral button with the full-colour "G";
	// Apple's black (light theme) or white (dark theme) button.
	.provider {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		min-height: 44px;
		padding: 0 $unit-2x;
		border-radius: $unit;
		border: 1px solid transparent;
		font-size: $font-regular;
		font-weight: $medium;
		text-decoration: none;
		transition:
			background-color 0.15s ease,
			box-shadow 0.15s ease;

		&:focus-visible {
			outline: 2px solid var(--accent-blue-focus, #4285f4);
			outline-offset: 2px;
		}
	}

	.logo {
		display: inline-flex;
		flex-shrink: 0;
	}

	.discord {
		background: #5865f2;
		color: #ffffff;

		&:hover {
			background: #4752c4;
		}
	}

	.google {
		background: #ffffff;
		border-color: #747775;
		color: #1f1f1f;
		font-family: 'Roboto', system-ui, sans-serif;

		&:hover {
			box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3);
		}
	}

	.apple {
		background: #000000;
		color: #ffffff;

		&:hover {
			background: #1a1a1a;
		}
	}

	:global(html[data-theme='dark']) {
		.google {
			background: #131314;
			border-color: #8e918f;
			color: #e3e3e3;
		}

		.apple {
			background: #ffffff;
			color: #000000;

			&:hover {
				background: #f2f2f2;
			}
		}
	}
</style>
