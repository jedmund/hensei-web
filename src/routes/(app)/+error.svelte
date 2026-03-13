<script lang="ts">
	import { page } from '$app/stores'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'
	import type { Party } from '$lib/types/api/party'
	import type { UserCookie } from '$lib/types/UserCookie'
	import GridRep from '$lib/components/reps/GridRep.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale, localizeHref } from '$lib/paraglide/runtime'

	const isJa = $derived(getLocale() === 'ja')

	let randomParty: Party | null = $state(null)

	const is404 = $derived($page.status === 404)

	const currentUser = $derived($page.data?.currentUser as UserCookie | null)
	const userElement = $derived(currentUser?.element ?? '')
	const linkColor = $derived(userElement ? `var(--${userElement}-bg)` : 'var(--link)')

	$effect(() => {
		if (!is404) return

		partyAdapter
			.list({ page: 1, per: 20 })
			.then((response) => {
				if (response.results.length > 0) {
					const index = Math.floor(Math.random() * response.results.length)
					randomParty = response.results[index]!
				}
			})
			.catch(() => {
				// Silently fail — the error page still works without a random team
			})
	})
</script>

<div class="error-container">
	<div class="error-message">
		<span class="status-code">{$page.status}</span>
		<h1>{is404 ? m.error_404_title() : m.error_something_went_wrong()}</h1>
	</div>

	{#if is404 && randomParty}
		<div class="random-team">
			<p class="random-label" class:ja={isJa}>{m.error_random_team_or_browse()}<br>{m.error_or()} <a href={localizeHref('/teams/explore')} style:color={linkColor}>{m.error_browse_teams()}</a></p>
			<div class="random-team-card">
				<GridRep party={randomParty} />
			</div>
		</div>
	{:else if is404}
		<a class="browse-link" href={localizeHref('/teams/explore')} style:color={linkColor}>{m.error_browse_teams()}</a>
	{:else}
		<a class="browse-link" href={localizeHref('/teams/explore')}>{m.error_browse_teams()}</a>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: spacing.$unit-4x;
		color: var(--text-primary);
	}

	.error-message {
		text-align: center;

		.status-code {
			display: block;
			font-size: 4.8rem;
			font-weight: typography.$medium;
			color: var(--text-tertiary);
			line-height: 1;
			margin: 0 0 spacing.$unit;
		}

		h1 {
			font-size: typography.$font-xlarge;
			font-weight: typography.$bold;
			margin: 0;
		}
	}

	.browse-link {
		color: var(--link);
		text-decoration: none;
		font-weight: typography.$medium;
		font-size: typography.$font-body;
		margin-top: spacing.$unit-3x;

		&:hover {
			text-decoration: underline;
		}
	}

	.random-team {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		margin-top: spacing.$unit-5x;
		width: 100%;
		max-width: 340px;
	}

	.random-label {
		font-size: typography.$font-body;
		color: var(--text-secondary);
		margin: 0;
		text-align: center;
		line-height: 1.4;

		&.ja {
			line-height: 1.8;
		}

		a {
			color: var(--link);
			text-decoration: none;
			font-weight: typography.$medium;

			&:hover {
				text-decoration: underline;
			}
		}
	}

	.random-team-card {
		width: 100%;

		:global(.gridRep a) {
			box-shadow:
				0 0 0 1px rgba(0, 0, 0, 0.1),
				0 0 4px rgba(0, 0, 0, 0.12);
		}
	}
</style>
