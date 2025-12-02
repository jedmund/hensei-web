<script lang="ts">
	import type { LayoutData } from './$types'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import { getAvatarSrc, getAvatarSrcSet } from '$lib/utils/avatar'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	let { data, children }: { data: LayoutData; children: any } = $props()

	const avatarFile = $derived(data.user?.avatar?.picture || '')
	const avatarSrc = $derived(getAvatarSrc(avatarFile))
	const avatarSrcSet = $derived(getAvatarSrcSet(avatarFile))

	// Determine active tab from URL path
	const activeTab = $derived.by(() => {
		const path = $page.url.pathname
		if (path.includes('/weapons')) return 'weapons'
		if (path.includes('/summons')) return 'summons'
		return 'characters'
	})

	const username = $derived(data.user?.username || $page.params.username)

	function handleTabChange(value: string) {
		goto(`/${username}/collection/${value}`)
	}
</script>

<svelte:head>
	<title>{username}'s Collection</title>
</svelte:head>

<section class="collection">
	<header class="header">
		{#if data.user?.avatar?.picture}
			<img
				class="avatar"
				alt={`Avatar of ${username}`}
				src={avatarSrc}
				srcset={avatarSrcSet}
				width="64"
				height="64"
			/>
		{:else}
			<div class="avatar" aria-hidden="true"></div>
		{/if}
		<div class="header-content">
			<h1>{username}'s Collection</h1>
			<nav class="tabs" aria-label="Profile sections">
				<a href="/{username}" data-sveltekit-preload-data="hover">Teams</a>
				<a href="/{username}/collection/characters" class="active">Collection</a>
			</nav>
		</div>
	</header>

	<!-- Entity type segmented control -->
	<nav class="entity-nav" aria-label="Collection type">
		<SegmentedControl value={activeTab} onValueChange={handleTabChange} gap={true}>
			<Segment value="characters">
				Characters
			</Segment>
			<Segment value="weapons" disabled>
				Weapons
			</Segment>
			<Segment value="summons" disabled>
				Summons
			</Segment>
		</SegmentedControl>
	</nav>

	<div class="content">
		{@render children()}
	</div>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;

	.collection {
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
		flex-shrink: 0;
	}

	.header-content {
		flex: 1;
	}

	h1 {
		margin: 0 0 $unit-half;
		font-size: 24px;
	}

	.tabs {
		display: flex;
		gap: $unit-2x;
	}

	.tabs a {
		text-decoration: none;
		color: var(--text-secondary);
		padding-bottom: 2px;
		border-bottom: 2px solid transparent;

		&:hover {
			color: var(--text-primary);
		}

		&.active {
			border-color: var(--accent-color, #3366ff);
			color: var(--accent-color, #3366ff);
		}
	}

	.entity-nav {
		margin-bottom: $unit-2x;
		max-width: 500px;
	}

	.content {
		min-height: 400px;
	}
</style>
