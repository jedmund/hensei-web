<svelte:options runes={true} />

<script lang="ts">
	import { goto, replaceState } from '$app/navigation'
	import { page } from '$app/stores'
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import CrewHeader from '$lib/components/crew/CrewHeader.svelte'
	import EditScoreModal from '$lib/components/crew/EditScoreModal.svelte'
	import EditCrewScoreModal from '$lib/components/crew/EditCrewScoreModal.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import {
		GW_ROUND_LABELS,
		type GwRound,
		type GwIndividualScore,
		type GwCrewScore,
		type CreateCrewScoreInput,
		type UpdateCrewScoreInput
	} from '$lib/types/api/gw'
	import type { PageData } from './$types'

	interface Props {
		data: PageData
	}

	let { data }: Props = $props()

	const queryClient = useQueryClient()

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

	// Element labels (matches GranblueEnums::ELEMENTS)
	const elementLabels: Record<number, string> = {
		0: 'Null',
		1: 'Wind',
		2: 'Fire',
		3: 'Water',
		4: 'Earth',
		5: 'Dark',
		6: 'Light'
	}

	const elementColors: Record<number, string> = {
		0: 'null',
		1: 'wind',
		2: 'fire',
		3: 'water',
		4: 'earth',
		5: 'dark',
		6: 'light'
	}

	// Aggregate scores by player, including members with 0 score
	interface PlayerScore {
		id: string
		name: string
		type: 'member' | 'phantom'
		totalScore: number
		isRetired?: boolean
		scores: GwIndividualScore[] // Individual score records for this player
	}

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

	// Format number with commas
	function formatScore(score: number): string {
		return score.toLocaleString()
	}

	// Parse score string, removing commas
	function parseScore(value: string): number {
		return parseInt(value.replace(/,/g, ''), 10)
	}

	// Format date
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		})
	}

	// Navigate back
	function handleBack() {
		goto('/crew')
	}

	// ==================== Add Score Modal ====================
	let showScoreModal = $state(false)
	let selectedPlayerId = $state<string | undefined>(undefined)
	let isCumulative = $state(true)
	let cumulativeScore = $state('')
	let roundScores = $state<Record<GwRound, string>>({
		0: '',
		1: '',
		2: '',
		3: '',
		4: '',
		5: ''
	})
	let isExcused = $state(false)
	let excuseReason = $state('')
	let isSubmitting = $state(false)

	// Player type tracking - value format is "member:id" or "phantom:id"
	const selectedPlayerType = $derived.by(() => {
		if (!selectedPlayerId) return null
		const [type] = selectedPlayerId.split(':')
		return type as 'member' | 'phantom'
	})

	const selectedPlayerActualId = $derived.by(() => {
		if (!selectedPlayerId) return null
		const [, id] = selectedPlayerId.split(':')
		return id
	})

	// Track which players already have scores for this event
	const playersWithScores = $derived.by(() => {
		const ids = new Set<string>()
		if (participation?.individualScores) {
			for (const score of participation.individualScores) {
				if (score.member?.id) {
					ids.add(`member:${score.member.id}`)
				} else if (score.phantom?.id) {
					ids.add(`phantom:${score.phantom.id}`)
				}
			}
		}
		return ids
	})

	// Player options for dropdown - members first, then phantoms
	// Excludes players who already have scores for this event
	const playerOptions = $derived.by(() => {
		const options: Array<{ value: string; label: string; suffix?: string }> = []

		// Add members (skip those with scores)
		for (const m of membersDuringEvent) {
			if (m.user) {
				const hasScore = playersWithScores.has(`member:${m.id}`)
				if (hasScore) continue
				options.push({
					value: `member:${m.id}`,
					label: m.user.username + (m.retired ? ' (Retired)' : '')
				})
			}
		}

		// Add phantoms (skip those with scores)
		for (const p of phantomPlayers) {
			const hasScore = playersWithScores.has(`phantom:${p.id}`)
			if (hasScore) continue
			options.push({
				value: `phantom:${p.id}`,
				label: p.name + (p.retired ? ' (Retired)' : ''),
				suffix: 'Phantom'
			})
		}

		return options
	})

	// Calculate cumulative from round scores
	const calculatedCumulativeScore = $derived.by(() => {
		if (isCumulative) return 0
		let total = 0
		for (const round of [0, 1, 2, 3, 4, 5] as GwRound[]) {
			const value = parseScore(roundScores[round] || '0')
			if (!isNaN(value)) total += value
		}
		return total
	})

	// Sync cumulative when round scores change
	$effect(() => {
		if (!isCumulative) {
			cumulativeScore = formatScore(calculatedCumulativeScore)
		}
	})

	// Add score mutation - uses by-event endpoint which auto-creates participation
	const addScoreMutation = createMutation(() => ({
		mutationFn: async () => {
			if (!gwEvent?.id || !selectedPlayerActualId || !selectedPlayerType) {
				throw new Error('Missing event or player')
			}

			if (isCumulative) {
				// Single cumulative score
				const score = parseScore(cumulativeScore)
				if (isNaN(score)) throw new Error('Invalid score')

				const input =
					selectedPlayerType === 'member'
						? { crewMembershipId: selectedPlayerActualId }
						: { phantomPlayerId: selectedPlayerActualId }

				return gwAdapter.addIndividualScoreByEvent(gwEvent.id, {
					...input,
					round: 0, // Cumulative scores go to preliminaries
					score,
					isCumulative: true,
					excused: isExcused,
					excuseReason: isExcused ? excuseReason : undefined
				})
			} else {
				// Batch add per-round scores
				const scores = []
				for (const round of [0, 1, 2, 3, 4, 5] as GwRound[]) {
					const value = parseScore(roundScores[round] || '0')
					if (!isNaN(value) && value > 0) {
						const entry =
							selectedPlayerType === 'member'
								? { crewMembershipId: selectedPlayerActualId }
								: { phantomPlayerId: selectedPlayerActualId }

						scores.push({
							...entry,
							round,
							score: value,
							isCumulative: false,
							excused: isExcused,
							excuseReason: isExcused ? excuseReason : undefined
						})
					}
				}

				if (scores.length === 0) {
					throw new Error('No scores entered')
				}

				return gwAdapter.batchAddIndividualScoresByEvent(gwEvent.id, { scores })
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw', 'event', eventNumber] })
			closeScoreModal()
		}
	}))

	function openScoreModal() {
		showScoreModal = true
		resetScoreForm()
	}

	function closeScoreModal() {
		showScoreModal = false
		resetScoreForm()
	}

	function resetScoreForm() {
		selectedPlayerId = undefined
		isCumulative = true
		cumulativeScore = ''
		roundScores = { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' }
		isExcused = false
		excuseReason = ''
		isSubmitting = false
	}

	async function handleSubmitScore() {
		isSubmitting = true
		try {
			await addScoreMutation.mutateAsync()
		} finally {
			isSubmitting = false
		}
	}

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
						<span class="element-badge element-{elementColors[gwEvent.element]}">
							{elementLabels[gwEvent.element] ?? 'Unknown'}
						</span>
						<span class="event-dates">
							{formatDate(gwEvent.startDate)} – {formatDate(gwEvent.endDate)}
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
						<Button variant="primary" size="small" onclick={openScoreModal}>Add Score</Button>
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
								<li class="player-item" class:retired={player.isRetired}>
									<div class="player-info">
										<span class="player-rank">{index + 1}</span>
										<span class="player-name">{player.name}</span>
										{#if player.isRetired}
											<span class="player-badge retired">Retired</span>
										{/if}
										{#if player.scores.some((s) => s.excused)}
											<span class="player-badge excused">Excused</span>
										{/if}
									</div>
									{#if player.type === 'phantom'}
										<span class="player-type">Phantom</span>
									{/if}
									<div class="player-actions">
										<span class="player-score">{formatScore(player.totalScore)}</span>
										{#if crewStore.isOfficer && player.scores.length > 0}
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
													{#if player.type === 'member'}
														<DropdownMenuBase.Item
															class="dropdown-menu-item"
															onclick={() => goto(`/${player.name}`)}
														>
															View profile
														</DropdownMenuBase.Item>
													{/if}
													<DropdownMenuBase.Item
														class="dropdown-menu-item"
														onclick={() => openEditScoreModal(player)}
													>
														Edit score...
													</DropdownMenuBase.Item>
												{/snippet}
											</DropdownMenu>
										{/if}
									</div>
								</li>
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
<Dialog bind:open={showScoreModal} onOpenChange={(open) => !open && closeScoreModal()}>
	<ModalHeader title="Add Score" />
	<ModalBody>
		<div class="score-form">
			<Select
				options={playerOptions}
				bind:value={selectedPlayerId}
				placeholder="Select player"
				label="Player"
				fullWidth
				contained
				portal
			/>

			<Input
				label="Cumulative Score"
				type="text"
				inputmode="numeric"
				bind:value={cumulativeScore}
				placeholder="Enter total score"
				disabled={!isCumulative}
				fullWidth
				contained
			/>

			<label class="checkbox-row">
				<Checkbox bind:checked={isCumulative} size="small" />
				<span>Cumulative score</span>
			</label>

			{#if !isCumulative}
				<div class="round-scores">
					{#each [0, 1, 2, 3, 4, 5] as round (round)}
						<Input
							label={GW_ROUND_LABELS[round as GwRound]}
							type="text"
							inputmode="numeric"
							bind:value={roundScores[round as GwRound]}
							placeholder="0"
							fullWidth
						/>
					{/each}
				</div>
			{/if}

			<div class="excused-section">
				<label class="checkbox-row">
					<Checkbox bind:checked={isExcused} size="small" contained />
					<span>Excused?</span>
				</label>
				{#if isExcused}
					<textarea
						class="excuse-textarea"
						bind:value={excuseReason}
						placeholder="Excusal reason (optional)"
						rows="2"
					></textarea>
				{/if}
			</div>

			{#if addScoreMutation.isError}
				<p class="error-message">
					{addScoreMutation.error?.message ?? 'Failed to add score'}
				</p>
			{/if}
		</div>
	</ModalBody>
	<ModalFooter
		onCancel={closeScoreModal}
		primaryAction={{
			label: isSubmitting ? 'Saving...' : 'Save',
			onclick: handleSubmitScore,
			disabled: isSubmitting ||
				!selectedPlayerId ||
				(!isCumulative && calculatedCumulativeScore === 0) ||
				(isCumulative && !cumulativeScore)
		}}
	/>
</Dialog>

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

	.element-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.element-null {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}

		&.element-fire {
			background: #fee2e2;
			color: #dc2626;
		}

		&.element-water {
			background: #dbeafe;
			color: #2563eb;
		}

		&.element-earth {
			background: #fef3c7;
			color: #d97706;
		}

		&.element-wind {
			background: #d1fae5;
			color: #059669;
		}

		&.element-light {
			background: #fef9c3;
			color: #ca8a04;
		}

		&.element-dark {
			background: #ede9fe;
			color: #7c3aed;
		}
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

	.player-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border-radius: layout.$item-corner;
		transition: background-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.retired {
			opacity: 0.6;
		}
	}

	.player-info {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.player-rank {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		min-width: 24px;
	}

	.player-name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
	}

	.player-badge {
		display: inline-block;
		padding: 2px 6px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;

		&.phantom {
			background: var(--color-purple-light, #ede9fe);
			color: var(--color-purple-dark, #7c3aed);
		}

		&.retired {
			background: rgba(0, 0, 0, 0.04);
			color: var(--text-secondary);
		}

		&.excused {
			background: var(--color-yellow-light, #fef9c3);
			color: var(--color-yellow-dark, #854d0e);
		}
	}

	.player-type {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin-left: auto;
		margin-right: spacing.$unit;
	}

	.player-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.player-score {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		font-variant-numeric: tabular-nums;
		min-width: 108px;
		text-align: right;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-3x;
		font-size: typography.$font-small;
	}

	// Score form styles
	.score-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		cursor: pointer;
		font-size: typography.$font-small;
	}

	.round-scores {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
		background: var(--input-section-bg);
		border-radius: layout.$card-corner;
	}

	.excused-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.excuse-textarea {
		width: 100%;
		padding: spacing.$unit;
		border: none;
		border-radius: layout.$input-corner;
		font-size: typography.$font-small;
		font-family: inherit;
		background: var(--input-bound-bg);
		color: var(--text-primary);
		resize: vertical;
		min-height: 60px;

		&::placeholder {
			color: var(--text-tertiary);
		}

		&:hover {
			background: var(--input-bound-bg-hover);
		}

		&:focus {
			outline: none;
			background: var(--input-bound-bg-hover);
		}
	}

	.error-message {
		color: colors.$error;
		font-size: typography.$font-small;
		margin: 0;
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
