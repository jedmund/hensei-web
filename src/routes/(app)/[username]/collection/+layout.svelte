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
	import { openAddArtifactSidebar } from '$lib/features/collection/openAddArtifactSidebar'

	let { data, children }: { data: LayoutData; children: any } = $props()

	let addModalOpen = $state(false)

	// Determine active entity type from URL path
	const activeEntityType = $derived.by(() => {
		const path = $page.url.pathname
		if (path.includes('/weapons')) return 'weapons'
		if (path.includes('/summons')) return 'summons'
		if (path.includes('/artifacts')) return 'artifacts'
		return 'characters'
	})

	// Map entity type to singular form for modal (only for supported types)
	const modalEntityType = $derived.by((): 'character' | 'weapon' | 'summon' | undefined => {
		if (activeEntityType === 'weapons') return 'weapon'
		if (activeEntityType === 'summons') return 'summon'
		if (activeEntityType === 'artifacts') return undefined // Artifacts use sidebar instead
		return 'character'
	})

	// Whether the current entity type supports the add modal (all except artifacts)
	const supportsAddModal = $derived(activeEntityType !== 'artifacts')

	// Whether to show the add button for artifacts (uses sidebar instead of modal)
	const isArtifacts = $derived(activeEntityType === 'artifacts')

	// Dynamic button text
	const addButtonText = $derived(`Add ${activeEntityType}`)

	const username = $derived(data.user?.username || $page.params.username)

	function handleTabChange(value: string) {
		goto(`/${username}/collection/${value}`)
	}

	function handleAddArtifact() {
		openAddArtifactSidebar()
	}
</script>

<svelte:head>
	<title>{username}</title>
</svelte:head>

<section class="collection">
	<ProfileHeader
		username={username ?? ''}
		avatarPicture={data.user?.avatar?.picture}
		element={data.user?.avatar?.element}
		granblueId={data.user?.granblueId}
		showGranblueId={data.user?.showGranblueId}
		showCrewGamertag={data.user?.showCrewGamertag}
		crewGamertag={data.user?.crewGamertag}
		title={username ?? ''}
		activeTab="collection"
		isOwner={data.isOwner}
	/>

	<div class="card-container">
		<!-- Entity type segmented control -->
		<nav class="entity-nav" aria-label="Collection type">
			<SegmentedControl
				value={activeEntityType}
				onValueChange={handleTabChange}
				variant="blended"
				size="small"
			>
				<Segment value="characters">Characters</Segment>
				<Segment value="weapons">Weapons</Segment>
				<Segment value="summons">Summons</Segment>
				<Segment value="artifacts">Artifacts</Segment>
			</SegmentedControl>

			{#if data.isOwner && supportsAddModal}
				<Button
					variant="primary"
					size="small"
					onclick={() => (addModalOpen = true)}
					icon="plus"
					iconPosition="left"
				>
					{addButtonText}
				</Button>
			{:else if data.isOwner && isArtifacts}
				<Button
					variant="primary"
					size="small"
					onclick={handleAddArtifact}
					icon="plus"
					iconPosition="left"
				>
					Add artifact
				</Button>
			{/if}
		</nav>

		<div class="content">
			{@render children()}
		</div>
	</div>
</section>

{#if data.isOwner && modalEntityType}
	<AddToCollectionModal
		userId={data.user.id}
		entityType={modalEntityType}
		bind:open={addModalOpen}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.collection {
		padding: $unit-2x 0;
	}

	.card-container {
		background: var(--card-bg);
		border-radius: $card-corner;
	}

	.entity-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
		padding: $unit-2x;
		border-bottom: 1px solid var(--border-subtle);
	}

	.content {
		padding: $unit-2x;
		min-height: 400px;
	}
</style>
