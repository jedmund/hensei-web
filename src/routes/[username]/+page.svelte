<script lang="ts">
	import type { PageData } from './$types'
	import { browser } from '$app/environment'
	import InfiniteScroll from '$lib/components/InfiniteScroll.svelte'
	import ExploreGrid from '$lib/components/explore/ExploreGrid.svelte'
	import { createInfiniteScrollResource } from '$lib/api/adapters/resources/infiniteScroll.resource.svelte'
	import { userAdapter } from '$lib/api/adapters/user.adapter'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'

	const { data } = $props() as { data: PageData }
	const tab = data.tab || 'teams'
	const isOwner = data.isOwner || false

	const avatarFile = data.user?.avatar?.picture || ''
	const avatarSrc = getAvatarSrc(avatarFile)
	const avatarSrcSet = getAvatarSrcSet(avatarFile)

	// Create infinite scroll resource for profile parties
	const profileResource = createInfiniteScrollResource({
		fetcher: async (page) => {
			if (tab === 'favorites' && isOwner) {
				const response = await userAdapter.getFavorites({ page })
				return {
					results: response.items,
					page: response.page,
					total: response.total,
					totalPages: response.totalPages,
					perPage: response.perPage
				}
			}
			return userAdapter.getProfileParties(data.user.username, page)
		},
		initialData: data.items,
		initialPage: data.page || 1,
		initialTotalPages: data.totalPages,
		initialTotal: data.total,
		threshold: 300,
		debounceMs: 200
	})

	// Initialize with SSR data on client
	$effect(() => {
		if (browser && data.items && !profileResource.items.length) {
			profileResource.initFromSSR({
				items: data.items,
				page: data.page || 1,
				totalPages: data.totalPages,
				total: data.total
			})
		}
	})
</script>

<section class="profile">
	<header class="header">
		{#if data.user?.avatar?.picture}
			<img
				class="avatar"
				alt={`Avatar of ${data.user.username}`}
				src={avatarSrc}
				srcset={avatarSrcSet}
				width="64"
				height="64"
			/>
		{:else}
			<div class="avatar" aria-hidden="true"></div>
		{/if}
		<div>
			<h1>{data.user.username}</h1>
			<nav class="tabs" aria-label="Profile sections">
				<a class:active={tab === 'teams'} href="?tab=teams" data-sveltekit-preload-data="hover"
					>Teams</a
				>
				{#if isOwner}
					<a
						class:active={tab === 'favorites'}
						href="?tab=favorites"
						data-sveltekit-preload-data="hover">Favorites</a
					>
				{/if}
			</nav>
		</div>
	</header>

	<InfiniteScroll resource={profileResource} class="profile-grid">
		<ExploreGrid items={profileResource.items} />

		{#snippet emptySnippet()}
			<div class="empty">
				<p>{tab === 'favorites' ? 'No favorite teams yet' : 'No teams found'}</p>
			</div>
		{/snippet}

		{#snippet endSnippet()}
			<div class="end">
				<p>You've seen all {tab === 'favorites' ? 'favorites' : 'teams'}!</p>
			</div>
		{/snippet}

		{#snippet errorSnippet(error)}
			<div class="error">
				<p>Failed to load {tab}: {error.message || 'Unknown error'}</p>
			</div>
		{/snippet}
	</InfiniteScroll>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;

	.profile {
		padding: $unit-2x 0;
	}
	.header {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		margin-bottom: $unit-2x;
	}
	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: $grey-80;
		border: 1px solid $grey-75;
		object-fit: cover;
	}
	.sub {
		color: $grey-55;
		margin: 0;
	}
	.tabs {
		display: flex;
		gap: $unit-2x;
		margin-top: $unit-half;
	}
	.tabs a {
		text-decoration: none;
		color: inherit;
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;
	}
	.tabs a.active {
		border-color: #3366ff;
		color: #3366ff;
	}

	.empty,
	.end,
	.error {
		text-align: center;
		padding: $unit-4x;
		color: var(--text-secondary);

		p {
			margin: 0;
		}
	}

	.error {
		color: var(--text-error, #dc2626);
	}
</style>
