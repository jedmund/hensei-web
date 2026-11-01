<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { goto, replaceState } from '$app/navigation'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import CrewPage from '$lib/components/crew/CrewPage.svelte'
	import CrewStatusMessage from '$lib/components/crew/CrewStatusMessage.svelte'
	import GwStatsRow from '$lib/components/crew/GwStatsRow.svelte'
	import EditScoreModal from '$lib/components/crew/EditScoreModal.svelte'
	import EditCrewScoreModal from '$lib/components/crew/EditCrewScoreModal.svelte'
	import AddScoreModal from '$lib/components/crew/AddScoreModal.svelte'
	import GwEventHeader from '$lib/components/crew/events/GwEventHeader.svelte'
	import GwIndividualHonors from '$lib/components/crew/events/GwIndividualHonors.svelte'
	import GwCrewHonors from '$lib/components/crew/events/GwCrewHonors.svelte'
	import { formatScore } from '$lib/utils/gw'
	import { buildPlayerScores, type PlayerScore } from '$lib/features/crew/playerScores'
	import { eventTabFromUrl, urlForEventTab, type EventTab } from '$lib/features/crew/eventTab'
	import type { GwRound, GwCrewScore } from '$lib/types/api/gw'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	// Get event number from URL
	const eventNumber = $derived($page.params.eventNumber)

	// Query for event and participation data
	const eventQuery = createQuery(() => ({
		queryKey: ['crew', 'gw', 'event', eventNumber],
		queryFn: () => gwAdapter.getEventWithParticipation(eventNumber ?? ''),
		enabled: !!eventNumber && crewStore.isInCrew
	}))

	const gwEvent = $derived(eventQuery.data?.gwEvent)
	const participation = $derived(eventQuery.data?.participation)
	const membersDuringEvent = $derived(eventQuery.data?.membersDuringEvent ?? [])
	const phantomPlayers = $derived(eventQuery.data?.phantomPlayers ?? [])

	// Tab state for switching between Individual and Crew honors, initialised
	// from the URL query param
	let activeTab = $state<EventTab>(eventTabFromUrl($page.url))

	// Update URL when tab changes
	function handleTabChange(newTab: EventTab) {
		activeTab = newTab
		replaceState(urlForEventTab($page.url, newTab), {})
	}

	// Crew scores from participation (Finals Day 1-4 only: rounds 2-5)
	const crewScores = $derived(participation?.crewScores ?? [])

	const playerScores = $derived(
		buildPlayerScores(membersDuringEvent, participation?.individualScores)
	)

	// Navigate back
	function handleBack() {
		goto(localizeHref('/crew'))
	}

	// ==================== Add Score Modal ====================
	let showScoreModal = $state(false)

	// ==================== Edit Score Modal ====================
	let showEditScoreModal = $state(false)
	let editingPlayer = $state<PlayerScore | null>(null)

	function openEditScoreModal(player: PlayerScore) {
		editingPlayer = player
		showEditScoreModal = true
	}

	// ==================== Crew Score Modal ====================
	let showCrewScoreModal = $state(false)
	let editingCrewScoreRound = $state<GwRound | null>(null)
	let editingCrewScore = $state<GwCrewScore | null>(null)

	function openCrewScoreModal(round: GwRound, existingScore?: GwCrewScore) {
		editingCrewScoreRound = round
		editingCrewScore = existingScore ?? null
		showCrewScoreModal = true
	}
</script>

<svelte:head>
	<title>GW #{eventNumber} / granblue.team</title>
</svelte:head>

<CrewPage padded>
	{#if eventQuery.isLoading}
		<CrewStatusMessage message={m.crew_loading_generic()} />
	{:else if !gwEvent}
		<CrewStatusMessage message={m.gw_event_not_found()}>
			<Button variant="secondary" size="small" onclick={handleBack}>Back to Crew</Button>
		</CrewStatusMessage>
	{:else}
		<GwEventHeader
			{gwEvent}
			{activeTab}
			onTabChange={handleTabChange}
			canAddScore={crewStore.isOfficer &&
				gwEvent.status !== 'upcoming' &&
				activeTab === 'individual'}
			onAddScore={() => (showScoreModal = true)}
		/>

		{#if !participation}
			<CrewStatusMessage
				variant="notice"
				message={m.gw_no_scores()}
				hint={crewStore.isOfficer && gwEvent.status !== 'upcoming'
					? m.gw_no_scores_hint()
					: undefined}
			/>
		{:else}
			<!-- Score summary (crew tab only) -->
			{#if activeTab === 'crew' && participation.totalScore !== undefined}
				<GwStatsRow
					stats={[
						{ value: formatScore(participation.totalScore), label: m.gw_total_honors() },
						{ value: participation.wins ?? 0, label: m.gw_wins() },
						{ value: participation.losses ?? 0, label: m.gw_losses() }
					]}
				/>
			{/if}

			{#if activeTab === 'individual'}
				<GwIndividualHonors
					individualScores={participation.individualScores}
					{playerScores}
					isOfficer={crewStore.isOfficer}
					onEditScore={openEditScoreModal}
				/>
			{/if}

			{#if activeTab === 'crew'}
				<GwCrewHonors
					{crewScores}
					isOfficer={crewStore.isOfficer}
					onEditCrewScore={openCrewScoreModal}
				/>
			{/if}
		{/if}
	{/if}
</CrewPage>

<!-- Add Score Modal -->
{#if gwEvent}
	<AddScoreModal
		bind:open={showScoreModal}
		eventId={gwEvent.id}
		eventNumber={eventNumber ?? ''}
		{membersDuringEvent}
		{phantomPlayers}
		existingScores={participation?.individualScores ?? []}
		element={data.user?.element as
			'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined}
	/>
{/if}

<!-- Edit Score Modal -->
{#if participation?.id && editingPlayer}
	<EditScoreModal
		bind:open={showEditScoreModal}
		participationId={participation.id}
		eventNumber={eventNumber ?? ''}
		playerName={editingPlayer.name}
		scores={editingPlayer.scores}
	/>
{/if}

<!-- Edit Crew Score Modal -->
{#if participation?.id && editingCrewScoreRound !== null}
	<EditCrewScoreModal
		bind:open={showCrewScoreModal}
		participationId={participation.id}
		eventNumber={eventNumber ?? ''}
		round={editingCrewScoreRound}
		existingScore={editingCrewScore}
	/>
{/if}
