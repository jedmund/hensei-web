
<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import { formatScore, parseScore } from '$lib/utils/gw'
	import { GW_ROUND_LABELS, type GwRound, type GwIndividualScore } from '$lib/types/api/gw'

	// Simplified types matching the API response
	interface MemberDuringEvent {
		id: string
		user?: { id: string; username: string }
		retired: boolean
	}

	interface PhantomPlayerMinimal {
		id: string
		name: string
		retired: boolean
	}

	interface Props {
		open: boolean
		eventId: string
		eventNumber: string
		membersDuringEvent: MemberDuringEvent[]
		phantomPlayers: PhantomPlayerMinimal[]
		existingScores: GwIndividualScore[]
	}

	let {
		open = $bindable(false),
		eventId,
		eventNumber,
		membersDuringEvent,
		phantomPlayers,
		existingScores
	}: Props = $props()

	const queryClient = useQueryClient()

	// Form state
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
		for (const score of existingScores) {
			if (score.member?.id) {
				ids.add(`member:${score.member.id}`)
			} else if (score.phantom?.id) {
				ids.add(`phantom:${score.phantom.id}`)
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

	// Add score mutation
	const addScoreMutation = createMutation(() => ({
		mutationFn: async () => {
			if (!eventId || !selectedPlayerActualId || !selectedPlayerType) {
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

				return gwAdapter.addIndividualScoreByEvent(eventId, {
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

				return gwAdapter.batchAddIndividualScoresByEvent(eventId, { scores })
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw', 'event', eventNumber] })
			handleClose()
		}
	}))

	function resetForm() {
		selectedPlayerId = undefined
		isCumulative = true
		cumulativeScore = ''
		roundScores = { 0: '', 1: '', 2: '', 3: '', 4: '', 5: '' }
		isExcused = false
		excuseReason = ''
		isSubmitting = false
	}

	function handleClose() {
		open = false
		resetForm()
	}

	async function handleSubmit() {
		isSubmitting = true
		try {
			await addScoreMutation.mutateAsync()
		} finally {
			isSubmitting = false
		}
	}

	// Initialize form when modal opens
	$effect(() => {
		if (open) {
			resetForm()
		}
	})

	// Validation
	const canSubmit = $derived(
		!isSubmitting &&
			selectedPlayerId &&
			((isCumulative && cumulativeScore) || (!isCumulative && calculatedCumulativeScore > 0))
	)
</script>

<Dialog bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
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
		onCancel={handleClose}
		primaryAction={{
			label: isSubmitting ? 'Saving...' : 'Save',
			onclick: handleSubmit,
			disabled: !canSubmit
		}}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

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
		color: var(--danger);
		font-size: typography.$font-small;
		margin: 0;
	}
</style>
