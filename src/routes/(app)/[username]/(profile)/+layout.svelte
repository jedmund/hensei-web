<script lang="ts">
	import type { Snippet } from 'svelte'
	import type { LayoutData } from './$types'
	import { page } from '$app/stores'
	import { beforeNavigate } from '$app/navigation'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import * as m from '$lib/paraglide/messages'

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

	// Lock app-shell scroll while the drawer is open. The scrollable element
	// in (app)/+layout.svelte is `.main-content`; targeting body/html doesn't
	// help because the shell sets the viewport to overflow:hidden.
	$effect(() => {
		if (typeof document === 'undefined') return
		const scroller = document.querySelector<HTMLElement>('.main-content')
		if (!scroller) return
		const previous = scroller.style.overflowY
		if (expanded) scroller.style.overflowY = 'hidden'
		return () => {
			scroller.style.overflowY = previous
		}
	})
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
		supportSummons={data.supportSummons}
		bind:expanded
	/>

	<div class="profile-below" class:dimmed={expanded}>
		{@render children()}
		{#if expanded}
			<button
				type="button"
				class="dim-backdrop"
				aria-label={m.profile_collapse()}
				onclick={() => (expanded = false)}
			></button>
		{/if}
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
		position: relative;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		transition: opacity 0.3s ease-in-out;

		&.dimmed {
			opacity: 0.3;
		}
	}

	.dim-backdrop {
		position: absolute;
		inset: 0;
		z-index: 1;
		background: transparent;
		border: none;
		padding: 0;
		cursor: pointer;
	}
</style>
