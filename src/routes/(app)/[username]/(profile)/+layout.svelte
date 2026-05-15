<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { LayoutData } from './$types'
	import { page } from '$app/stores'
	import { beforeNavigate } from '$app/navigation'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'

	let { data, children }: { data: LayoutData; children: Snippet } = $props()

	let expanded = $state(false)
	beforeNavigate(() => {
		expanded = false
	})

	const activeTab = $derived.by<'teams' | 'favorites' | 'playlists' | 'collection'>(() => {
		const path = $page.url.pathname
		if (path.endsWith('/favorites')) return 'favorites'
		if (path.endsWith('/playlists') || path.includes('/playlists/')) return 'playlists'
		if (path.includes('/collection')) return 'collection'
		return 'teams'
	})

	const viewerCrewRole = $derived(crewStore.membership?.role ?? null)
	const viewerCrewId = $derived(crewStore.crew?.id ?? null)
</script>

<section class="profile">
	<ProfileHeader
		username={data.user.username}
		displayName={data.user?.displayName}
		description={data.user?.description}
		userId={data.user?.id}
		avatarPicture={data.user?.avatar?.picture}
		element={data.user?.avatar?.element}
		granblueId={data.user?.granblueId}
		wikiProfile={data.user?.wikiProfile}
		youtube={data.user?.youtube}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		crewName={data.user?.crewName}
		{activeTab}
		isOwner={data.isOwner}
		{viewerCrewRole}
		{viewerCrewId}
		collectionPrivacy={data.user?.collectionPrivacy}
		isAuthenticated={data.isAuthenticated}
		bind:expanded
	/>

	<div class="profile-below" class:dimmed={expanded}>
		{@render children()}
	</div>
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.profile {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.profile-below {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		transition: opacity 0.3s ease-in-out;

		&.dimmed {
			opacity: 0.3;
			pointer-events: none;
		}
	}
</style>
