<script lang="ts">
	import type { SocialProvider } from '$lib/auth/socialProviders'
	import { SOCIAL_PROVIDER_LABELS } from '$lib/auth/socialProviders'
	import Button from '$lib/components/ui/Button.svelte'
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
					<span class="logo" aria-hidden="true">
						{#if provider === 'discord'}
							<!-- Discord symbol, from discord.com/branding -->
							<svg viewBox="0 0 126.644 96" width="24" height="18">
								<path
									fill="currentColor"
									d="M81.15,0c-1.2376,2.1973-2.3489,4.4704-3.3591,6.794-9.5975-1.4396-19.3718-1.4396-28.9945,0-.985-2.3236-2.1216-4.5967-3.3591-6.794-9.0166,1.5407-17.8059,4.2431-26.1405,8.0568C2.779,32.5304-1.6914,56.3725.5312,79.8863c9.6732,7.1476,20.5083,12.603,32.0505,16.0884,2.6014-3.4854,4.8998-7.1981,6.8698-11.0623-3.738-1.3891-7.3497-3.1318-10.8098-5.1523.9092-.6567,1.7932-1.3386,2.6519-1.9953,20.281,9.547,43.7696,9.547,64.0758,0,.8587.7072,1.7427,1.3891,2.6519,1.9953-3.4601,2.0457-7.0718,3.7632-10.835,5.1776,1.97,3.8642,4.2683,7.5769,6.8698,11.0623,11.5419-3.4854,22.3769-8.9156,32.0509-16.0631,2.626-27.2771-4.496-50.9172-18.817-71.8548C98.9811,4.2684,90.1918,1.5659,81.1752.0505l-.0252-.0505ZM42.2802,65.4144c-6.2383,0-11.4159-5.6575-11.4159-12.6535s4.9755-12.6788,11.3907-12.6788,11.5169,5.708,11.4159,12.6788c-.101,6.9708-5.026,12.6535-11.3907,12.6535ZM84.3576,65.4144c-6.2637,0-11.3907-5.6575-11.3907-12.6535s4.9755-12.6788,11.3907-12.6788,11.4917,5.708,11.3906,12.6788c-.101,6.9708-5.026,12.6535-11.3906,12.6535Z"
								/>
							</svg>
						{:else if provider === 'google'}
							<!-- Google "G", per the Sign in with Google branding guidelines -->
							<svg viewBox="1 1 22 22" width="18" height="18">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
						{:else}
							<!-- Apple logo, from Apple's Sign in with Apple design resources -->
							<svg viewBox="20.5 16 15 19" width="16" height="20">
								<path
									fill="currentColor"
									d="M28.2226562,20.3846154 C29.0546875,20.3846154 30.0976562,19.8048315 30.71875,19.0317864 C31.28125,18.3312142 31.6914062,17.352829 31.6914062,16.3744437 C31.6914062,16.2415766 31.6796875,16.1087095 31.65625,16 C30.7304687,16.0362365 29.6171875,16.640178 28.9492187,17.4494596 C28.421875,18.06548 27.9414062,19.0317864 27.9414062,20.0222505 C27.9414062,20.1671964 27.9648438,20.3121424 27.9765625,20.3604577 C28.0351562,20.3725366 28.1289062,20.3846154 28.2226562,20.3846154 Z M25.2929688,35 C26.4296875,35 26.9335938,34.214876 28.3515625,34.214876 C29.7929688,34.214876 30.109375,34.9758423 31.375,34.9758423 C32.6171875,34.9758423 33.4492188,33.792117 34.234375,32.6325493 C35.1132812,31.3038779 35.4765625,29.9993643 35.5,29.9389701 C35.4179688,29.9148125 33.0390625,28.9122695 33.0390625,26.0979021 C33.0390625,23.6579784 34.9140625,22.5588048 35.0195312,22.474253 C33.7773438,20.6382708 31.890625,20.5899555 31.375,20.5899555 C29.9804688,20.5899555 28.84375,21.4596313 28.1289062,21.4596313 C27.3554688,21.4596313 26.3359375,20.6382708 25.1289062,20.6382708 C22.8320312,20.6382708 20.5,22.5950413 20.5,26.2911634 C20.5,28.5861411 21.3671875,31.013986 22.4335938,32.5842339 C23.3476562,33.9129053 24.1445312,35 25.2929688,35 Z"
								/>
							</svg>
						{/if}
					</span>
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

	.logo {
		display: inline-flex;
		align-items: center;
		justify-content: center;
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
