<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { page } from '$app/state'
	import { replaceState } from '$app/navigation'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import CrewPage from '$lib/components/crew/CrewPage.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import CrewTabs from '$lib/components/crew/CrewTabs.svelte'
	import CrewSettingsDialog from '$lib/components/crew/CrewSettingsDialog.svelte'
	import CrewNotificationCards from '$lib/components/crew/CrewNotificationCards.svelte'
	import CreateCrewDialog from '$lib/components/crew/dashboard/CreateCrewDialog.svelte'
	import CrewEventList from '$lib/components/crew/dashboard/CrewEventList.svelte'
	import CrewGameLink from '$lib/components/crew/dashboard/CrewGameLink.svelte'
	import CrewIntro from '$lib/components/crew/dashboard/CrewIntro.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const isAuthenticated = $derived(data.isAuthenticated)
	// Query for the user's crew (only when authenticated)
	const crewQuery = createQuery(() => ({
		...crewQueries.myCrew(),
		enabled: isAuthenticated
	}))

	// Query for pending invitations (only when authenticated)
	const invitationsQuery = createQuery(() => ({
		...crewQueries.pendingInvitations(),
		enabled: isAuthenticated
	}))

	// Query for pending phantom claims (only when authenticated and in a crew)
	const phantomClaimsQuery = createQuery(() => ({
		...crewQueries.pendingPhantomClaims(),
		enabled: isAuthenticated && crewStore.isInCrew
	}))

	// Query for GW events (only when in crew)
	const eventsQuery = createQuery(() => ({
		queryKey: ['gw', 'events'],
		queryFn: () => gwAdapter.getEvents(),
		enabled: crewStore.isInCrew,
		staleTime: 1000 * 60 * 5
	}))

	// Modal state
	let createModalOpen = $state(false)
	let settingsModalOpen = $state(false)

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'
	const userElement = $derived(data.currentUser?.element as ElementName | undefined)

	// `?settings` (what /crew/settings redirects to) opens the settings dialog
	// once the crew has loaded. The URL carries the flag while it's open, so
	// it can be shared or reloaded.
	const SETTINGS_PARAM = 'settings'

	function setSettingsParam(on: boolean) {
		// The address bar, not page.url, which shallow replaceState doesn't update
		const url = new URL(window.location.href)
		if (url.searchParams.has(SETTINGS_PARAM) === on) return
		if (on) url.searchParams.set(SETTINGS_PARAM, '')
		else url.searchParams.delete(SETTINGS_PARAM)
		replaceState(url.pathname + url.search.replace(/=(?=&|$)/g, ''), page.state)
	}

	// Not reactive: only used to spot the open → closed transition
	let settingsWasOpen = false

	$effect(() => {
		const wantsSettings = page.url.searchParams.has(SETTINGS_PARAM)
		const isOpen = settingsModalOpen
		if (crewQuery.isLoading) return

		if (isOpen) {
			settingsWasOpen = true
		} else if (settingsWasOpen) {
			// Just closed, however it was closed
			settingsWasOpen = false
			setSettingsParam(false)
		} else if (wantsSettings) {
			// Wait for the layout to copy the crew into crewStore (a tick after
			// the query) before opening; drop the flag if there's no crew
			if (!crewQuery.data) setSettingsParam(false)
			else if (crewStore.isInCrew) settingsModalOpen = true
		}
	})

	function openSettings() {
		settingsModalOpen = true
		setSettingsParam(true)
	}
</script>

<svelte:head>
	<title>Crew / granblue.team</title>
</svelte:head>

<CrewPage>
	{#if crewQuery.isLoading}
		<CrewStatusMessage message={m.crew_loading()} />
	{:else if !isAuthenticated || crewQuery.isError || !crewStore.isInCrew}
		<!-- No crew state -->
		<div class="no-crew">
			<CrewIntro {isAuthenticated} onCreate={() => (createModalOpen = true)} />

			{#if isAuthenticated && invitationsQuery.data && invitationsQuery.data.length > 0}
				<div class="notifications-section">
					<CrewNotificationCards invitations={invitationsQuery.data} />
				</div>
			{/if}
		</div>
	{:else}
		<!-- Has crew - show dashboard -->
		<div class="crew-dashboard">
			<CrewHeader
				title={crewStore.crew?.name ?? ''}
				subtitle={crewStore.crew?.gamertag ?? undefined}
				description={crewStore.crew?.description ?? undefined}
			>
				{#snippet actions()}
					{#if crewStore.crew?.granblueCrewId}
						<CrewGameLink granblueCrewId={crewStore.crew.granblueCrewId} />
					{/if}
					<Button variant="secondary" size="small" onclick={openSettings}
						>{m.crew_settings_title()}</Button
					>
				{/snippet}
			</CrewHeader>

			<CrewTabs userElement={data.currentUser?.element} />

			{#if phantomClaimsQuery.data && phantomClaimsQuery.data.length > 0}
				<div class="notifications-section">
					<CrewNotificationCards phantomClaims={phantomClaimsQuery.data} />
				</div>
			{/if}

			<CrewEventList events={eventsQuery.data} isLoading={eventsQuery.isLoading} />
		</div>
	{/if}
</CrewPage>

<CreateCrewDialog bind:open={createModalOpen} />

<CrewSettingsDialog bind:open={settingsModalOpen} element={userElement} />

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.notifications-section {
		padding: spacing.$unit-2x;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}

	// Input (used by the crew dialogs) wraps its field in a fieldset
	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}
</style>
