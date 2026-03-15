<script lang="ts">
	import { browser } from '$app/environment'
	import { goto } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'
	import { useMigrateParties } from '$lib/api/mutations/party.mutations'
	import { getAllEditKeys, hasEditKeys, removeEditKeys } from '$lib/utils/editKeys'
	import { userQueries } from '$lib/api/queries/user.queries'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizeHref } from '$lib/paraglide/runtime'

	const isAuthenticated = $derived($page.data?.isAuthenticated)
	const currentUser = $derived($page.data?.currentUser)

	// Redirect unauthenticated users
	$effect(() => {
		if (browser && !isAuthenticated) {
			goto(localizeHref('/'))
		}
	})

	// Collect edit keys from localStorage
	const editKeys = browser ? getAllEditKeys() : []
	const hasLocalKeys = browser ? hasEditKeys() : false

	// Check for server-stored keys too
	const meQuery = createQuery(() => ({
		...userQueries.me(),
		enabled: browser && isAuthenticated
	}))
	const hasServerKeys = $derived(meQuery.data?.hasStoredEditKeys ?? false)

	// Preview query — fires when we have local keys OR server-stored keys
	// If no local keys, send empty array so the server falls back to deposited keys
	const previewQuery = createQuery(() => ({
		queryKey: ['parties', 'previewMigrate', editKeys],
		queryFn: () => partyAdapter.previewMigrate(hasLocalKeys ? editKeys : []),
		enabled: browser && isAuthenticated && (hasLocalKeys || hasServerKeys)
	}))

	// Derive ready parties
	const readyParties = $derived(
		previewQuery.data?.parties
			?.filter((p) => p.status === 'ready' && p.party !== null)
			.map((p) => p.party!) ?? []
	)

	const readyCount = $derived(readyParties.length)

	// Migration
	const migrateMutation = useMigrateParties()
	let migrating = $state(false)
	let migrated = $state(false)

	async function handleMigrate() {
		migrating = true
		try {
			const response = await migrateMutation.mutateAsync(editKeys)
			const completedShortcodes = response.results
				.filter((r) => r.status === 'migrated' || r.status === 'already_claimed')
				.map((r) => r.shortcode)
			removeEditKeys(completedShortcodes)
			migrated = true
		} finally {
			migrating = false
		}
	}
</script>

<PageMeta title={m.migrate_page_title()} description={m.migrate_page_description()} />

<section class="migrate-page">
	<div class="card">
		<div class="card-header">
			<div class="card-text">
				<p>{m.migrate_page_description()}</p>
			</div>
			{#if !previewQuery.isLoading && readyCount > 0}
				{#if migrated}
					<div class="success-badge">
						<Icon name="check" size={14} />
						Migrated
					</div>
				{:else}
					<Button size="small" onclick={handleMigrate} disabled={migrating || readyCount === 0}>
						{migrating ? m.migrate_page_migrating() : m.migrate_page_button()}
					</Button>
				{/if}
			{/if}
		</div>
	</div>

	{#if previewQuery.isLoading || (meQuery.isLoading && !hasLocalKeys)}
		<div class="loading">
			<Icon name="loader-2" size={32} />
		</div>
	{:else if (!hasLocalKeys && !hasServerKeys) || readyCount === 0}
		<div class="empty">
			<p>{m.migrate_page_empty()}</p>
			<p class="empty-description">{m.migrate_page_empty_description()}</p>
			{#if currentUser?.username}
				<Button href={localizeHref(`/${currentUser.username}`)} size="small">
					{m.migrate_banner_action()}
				</Button>
			{/if}
		</div>
	{:else}
		<div class="migrate-grid" class:migrated>
			<ExploreGrid items={readyParties} />
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.migrate-page {
		padding: $unit-2x 0;
	}

	.card {
		background: var(--card-bg);
		border: $card-border;
		border-radius: $page-corner;
		box-shadow: $page-elevation;
		padding: $unit-2x;
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
	}

	.card-text {
		display: flex;
		flex-direction: column;

		p {
			margin: 0;
			font-size: $font-small;
			color: var(--text-secondary);
			line-height: 1.5;
		}
	}

	.loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: $unit;
		padding: $unit-4x;
		color: var(--text-secondary);

		:global(svg) {
			animation: spin 1s linear infinite;
		}
	}

	.empty {
		text-align: center;
		padding: $unit-4x;
		color: var(--text-secondary);

		p {
			margin: 0;
		}

		.empty-description {
			margin-top: $unit-half;
			font-size: $font-small;
		}

		:global(a),
		:global(button) {
			margin-top: $unit-2x;
		}
	}

	.success-badge {
		display: flex;
		align-items: center;
		gap: $unit-half;
		padding: $unit $unit + $unit-half;
		font-size: $font-small;
		font-weight: $medium;
		color: white;
		background: var(--toast-success-text);
		border-radius: $card-corner;
		white-space: nowrap;

		:global(svg) {
			color: white;
		}
	}

	.migrate-grid.migrated {
		opacity: 0.6;
		pointer-events: none;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
