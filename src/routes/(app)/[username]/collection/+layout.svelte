<script lang="ts">
	import type { LayoutData } from './$types'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'

	let { data, children }: { data: LayoutData; children: any } = $props()

	// Determine active entity type from URL path
	const activeEntityType = $derived.by(() => {
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
	<ProfileHeader
		{username}
		avatarPicture={data.user?.avatar?.picture}
		title="{username}'s Collection"
		activeTab="collection"
		isOwner={data.isOwner}
	/>

	<!-- Entity type segmented control -->
	<nav class="entity-nav" aria-label="Collection type">
		<SegmentedControl value={activeEntityType} onValueChange={handleTabChange} gap={true}>
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

	.collection {
		padding: $unit-2x 0;
	}

	.entity-nav {
		margin-bottom: $unit-2x;
		max-width: 500px;
	}

	.content {
		min-height: 400px;
	}
</style>
