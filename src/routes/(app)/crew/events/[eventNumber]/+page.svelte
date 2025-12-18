<svelte:options runes={true} />

<script lang="ts">
	import { goto, replaceState } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import EditScoreModal from '$lib/components/crew/EditScoreModal.svelte'
	import EditCrewScoreModal from '$lib/components/crew/EditCrewScoreModal.svelte'
	import AddScoreModal from '$lib/components/crew/AddScoreModal.svelte'
	import PlayerScoreRow, { type PlayerScore } from '$lib/components/crew/PlayerScoreRow.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import { formatDateJST } from '$lib/utils/date'
	import { formatScore } from '$lib/utils/gw'
	import { GW_ROUND_LABELS, type GwRound, type GwCrewScore } from '$lib/types/api/gw'
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

	// Tab state for switching between Individual and Crew honors
	// Initialize from URL query param
	const urlHasCrew = $page.url.searchParams.has('crew')
	let activeTab = $state<'individual' | 'crew'>(urlHasCrew ? 'crew' : 'individual')

	// Update URL when tab changes
	function handleTabChange(newTab: 'individual' | 'crew') {
		activeTab = newTab
		const url = new URL($page.url)
		if (newTab === 'crew') {
			url.searchParams.set('crew', '')
		} else {
			url.searchParams.delete('crew')
		}
		replaceState(url, {})
	}

	// Crew scores from participation (Finals Day 1-4 only: rounds 2-5)
	const crewScores = $derived(participation?.crewScores ?? [])

	const playerScores = $derived.by(() => {
		const scoreMap = new Map<string, PlayerScore>()

		// First, add all members who were active during the event (with 0 score)
		for (const member of membersDuringEvent) {
			if (member.user) {
				scoreMap.set(member.id, {
					id: member.id,
					name: member.user.username,
					type: 'member',
					totalScore: 0,
					isRetired: member.retired,
					scores: []
				})
			}
		}

		// Then add/update with actual scores
		if (participation?.individualScores) {
			for (const score of participation.individualScores) {
				const playerId = score.member?.id ?? score.phantom?.id ?? score.playerName
				const existing = scoreMap.get(playerId)

				if (existing) {
					existing.totalScore += score.score
					existing.scores.push(score)
				} else {
					// Phantom player or member not in membersDuringEvent
					scoreMap.set(playerId, {
						id: playerId,
						name: score.playerName,
						type: score.playerType,
						totalScore: score.score,
						isRetired: score.member?.retired,
						scores: [score]
					})
				}
			}
		}

		// Sort by total score descending
		return Array.from(scoreMap.values()).sort((a, b) => b.totalScore - a.totalScore)
	})

	// Navigate back
	function handleBack() {
		goto('/crew')
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

	function closeCrewScoreModal() {
		showCrewScoreModal = false
		editingCrewScoreRound = null
		editingCrewScore = null
	}
</script>

<svelte:head>
	<title>GW #{eventNumber} / granblue.team</title>
</svelte:head>

<div class="page">
	<div class="card">
		{#if eventQuery.isLoading}
			<div class="loading-state">
				<p>Loading...</p>
			</div>
		{:else if !gwEvent}
			<div class="error-state">
				<p>Event not found</p>
				<Button variant="secondary" size="small" onclick={handleBack}>Back to Crew</Button>
			</div>
		{:else}
			<CrewHeader title="GW #{gwEvent.eventNumber}" backHref="/crew">
				{#snippet belowTitle()}
					<div class="event-meta">
						<ElementBadge element={gwEvent.element} />
						<span class="event-dates">
							{formatDateJST(gwEvent.startDate)} – {formatDateJST(gwEvent.endDate)}
						</span>
					</div>
					<div class="tab-control">
						<SegmentedControl value={activeTab} onValueChange={(v) => handleTabChange(v as 'individual' | 'crew')} size="small" variant="background" grow>
							<Segment value="individual">Individual</Segment>
							<Segment value="crew">Crew</Segment>
						</SegmentedControl>
					</div>
				{/snippet}
				{#snippet actions()}
					{#if crewStore.isOfficer && gwEvent.status !== 'upcoming' && activeTab === 'individual'}
						<Button variant="primary" size="small" onclick={() => (showScoreModal = true)}>Add Score</Button>
					{/if}
				{/snippet}
			</CrewHeader>

			{#if !participation}
				<div class="not-participating">
					<p>No scores recorded yet for this event.</p>
					{#if crewStore.isOfficer && gwEvent.status !== 'upcoming'}
						<p class="hint">Click "Add Score" above to start recording scores.</p>
					{/if}
				</div>
			{:else}
				<!-- Score summary (crew tab only) -->
				{#if activeTab === 'crew' && participation.totalScore !== undefined}
					<div class="stats-row">
						<div class="stat">
							<span class="stat-value">{formatScore(participation.totalScore)}</span>
							<span class="stat-label">Total Honors</span>
						</div>
						<div class="stat">
							<span class="stat-value">{participation.wins ?? 0}</span>
							<span class="stat-label">Wins</span>
						</div>
						<div class="stat">
							<span class="stat-value">{participation.losses ?? 0}</span>
							<span class="stat-label">Losses</span>
						</div>
					</div>
				{/if}

				<!-- Individual Honors Tab -->
				{#if activeTab === 'individual'}
					<div class="section-header">
						<span class="section-title">Individual Scores</span>
					</div>

					{#if playerScores.length > 0}
						<ul class="player-list">
							{#each playerScores as player, index}
								<PlayerScoreRow
									{player}
									rank={index + 1}
									isOfficer={crewStore.isOfficer}
									onEditScore={() => openEditScoreModal(player)}
								/>
							{/each}
						</ul>
					{:else}
						<p class="empty-state">No scores recorded yet</p>
					{/if}
				{/if}

				<!-- Crew Honors Tab -->
				{#if activeTab === 'crew'}
					<div class="crew-score-table">
						<div class="crew-score-header">
							<span class="col-round">Round</span>
							<span class="col-our-score">Our Score</span>
							<span class="col-their-score">Their Score</span>
							<span class="col-actions"></span>
						</div>
						{#each [2, 3, 4, 5] as round (round)}
							{@const score = crewScores.find((s) => s.round === round)}
							<div class="crew-score-row">
								<div class="col-round">
									<span class="round-label">{GW_ROUND_LABELS[round as GwRound]}</span>
									{#if score?.victory !== undefined && score.victory !== null}
										<span class="result-badge" class:win={score.victory} class:loss={!score.victory}>
											{score.victory ? 'Win' : 'Loss'}
										</span>
									{/if}
								</div>
								<div class="col-our-score">
									{#if score}
										<span class="score-value" class:winner={score.victory === true}>{formatScore(score.crewScore)}</span>
									{:else}
										<span class="score-empty">—</span>
									{/if}
								</div>
								<div class="col-their-score">
									{#if score}
										{#if score.opponentScore !== null}
											<span class="score-value" class:winner={score.victory === false}>{formatScore(score.opponentScore)}</span>
										{/if}
										{#if score.opponentName}
											<span class="opponent-name">({score.opponentName})</span>
										{/if}
									{:else}
										<span class="score-empty">—</span>
									{/if}
								</div>
								<div class="col-actions">
									{#if score}
										{#if crewStore.isOfficer}
											<DropdownMenu>
												{#snippet trigger({ props })}
													<Button
														variant="ghost"
														size="small"
														iconOnly
														icon="ellipsis"
														{...props}
													/>
												{/snippet}
												{#snippet menu()}
													<DropdownMenuBase.Item
														class="dropdown-menu-item"
														onclick={() => openCrewScoreModal(round as GwRound, score)}
													>
														Edit score...
													</DropdownMenuBase.Item>
												{/snippet}
											</DropdownMenu>
										{/if}
									{:else}
										{#if crewStore.isOfficer}
											<Button size="small" onclick={() => openCrewScoreModal(round as GwRound)}>
												Record
											</Button>
										{/if}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			{/if}
		{/if}
	</div>
</div>

<!-- Add Score Modal -->
{#if gwEvent}
	<AddScoreModal
		bind:open={showScoreModal}
		eventId={gwEvent.id}
		eventNumber={eventNumber ?? ''}
		{membersDuringEvent}
		{phantomPlayers}
		existingScores={participation?.individualScores ?? []}
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

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		padding: spacing.$unit-2x 0;
		margin: 0 auto;
		max-width: var(--main-max-width);
	}

	.card {
		background: var(--card-bg);
		border: 0.5px solid rgba(0, 0, 0, 0.18);
		border-radius: layout.$page-corner;
		box-shadow: effects.$page-elevation;
		overflow: hidden;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: spacing.$unit-4x;
		gap: spacing.$unit-2x;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.event-dates {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.not-participating {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
		font-size: typography.$font-small;

		p {
			margin: 0;
		}

		.hint {
			color: var(--text-tertiary);
		}
	}

	.stats-row {
		display: flex;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.stat {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: spacing.$unit-2x;
		border-right: 1px solid rgba(0, 0, 0, 0.08);

		&:last-child {
			border-right: none;
		}
	}

	.stat-value {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
		margin-bottom: 2px;
	}

	.stat-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.section-header {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.section-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.player-list {
		list-style: none;
		margin: 0;
		padding: spacing.$unit;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-3x;
		font-size: typography.$font-small;
	}

	// Tab control
	.tab-control {
		margin-top: spacing.$unit;
	}

	// Crew scores table
	.crew-score-table {
		display: flex;
		flex-direction: column;
	}

	.crew-score-header {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.crew-score-row {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border-bottom: 1px solid rgba(0, 0, 0, 0.04);
		transition: background-color 0.15s;

		&:last-child {
			border-bottom: none;
		}

		&:hover {
			background: rgba(0, 0, 0, 0.02);
		}
	}

	.col-round {
		flex: 2;
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.col-our-score {
		width: 120px;
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.col-their-score {
		flex: 1;
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.col-actions {
		width: 80px;
		display: flex;
		justify-content: flex-end;
	}

	.round-label {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
	}

	.score-value {
		font-size: typography.$font-small;
		font-variant-numeric: tabular-nums;

		&.winner {
			font-weight: typography.$medium;
		}
	}

	.score-empty {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.opponent-name {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.result-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 24px;
		height: 24px;
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.win {
			background: var(--color-green-light, #dcfce7);
			color: var(--color-green-dark, #166534);
		}

		&.loss {
			background: colors.$error--bg--light;
			color: colors.$error;
		}
	}

</style>
