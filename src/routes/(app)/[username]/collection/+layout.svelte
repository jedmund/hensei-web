<script lang="ts">
	import type { LayoutData } from './$types'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import ProfileHeader from '$lib/components/profile/ProfileHeader.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import AddToCollectionModal from '$lib/components/collection/AddToCollectionModal.svelte'

	let { data, children }: { data: LayoutData; children: any } = $props()

	let addModalOpen = $state(false)

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
	<title>{username}</title>
</svelte:head>

<section class="collection">
	<ProfileHeader
		{username}
		avatarPicture={data.user?.avatar?.picture}
		title={username}
		activeTab="collection"
		isOwner={data.isOwner}
	/>

	<!-- Entity type segmented control -->
	<nav class="entity-nav" aria-label="Collection type">
		<SegmentedControl
			value={activeEntityType}
			onValueChange={handleTabChange}
			variant="blended"
			size="small"
		>
			<Segment value="characters">Characters</Segment>
			<Segment value="weapons" disabled>Weapons</Segment>
			<Segment value="summons" disabled>Summons</Segment>
		</SegmentedControl>

		{#if data.isOwner}
			<Button
				variant="primary"
				size="small"
				onclick={() => (addModalOpen = true)}
				icon="plus"
				iconPosition="left"
			>
				Add characters
			</Button>
		{/if}
	</nav>

	<div class="content">
		{@render children()}
	</div>
</section>

{#if data.isOwner}
	<AddToCollectionModal userId={data.user.id} bind:open={addModalOpen} />
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.collection {
		padding: $unit-2x 0;
	}

	.entity-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
		margin-bottom: $unit-2x;

		:global(.button) {
			align-self: stretch;
		}
	}

	.content {
		min-height: 400px;
	}
</style>
