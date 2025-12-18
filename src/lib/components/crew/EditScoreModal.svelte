<svelte:options runes={true} />

<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import { GW_ROUND_LABELS, type GwIndividualScore, type GwRound } from '$lib/types/api/gw'

	interface Props {
		open: boolean
		participationId: string
		eventNumber: string
		playerName: string
		scores: GwIndividualScore[]
	}

	let { open = $bindable(false), participationId, eventNumber, playerName, scores }: Props =
		$props()

	const queryClient = useQueryClient()

	// Edit state - maps scoreId to edited values
	let editValues = $state<Record<string, string>>({})
	let excusedValues = $state<Record<string, boolean>>({})
	let excuseReasonValues = $state<Record<string, string>>({})
	let isSubmitting = $state(false)
	let error = $state<string | null>(null)

	// Update individual score mutation
	const updateScoreMutation = createMutation(() => ({
		mutationFn: async ({
			scoreId,
			score,
			excused,
			excuseReason
		}: {
			scoreId: string
			score: number
			excused: boolean
			excuseReason: string
		}) => {
			return gwAdapter.updateIndividualScore(participationId, scoreId, {
				score,
				excused,
				excuseReason: excused ? excuseReason : undefined
			})
		}
	}))

	// Delete individual score mutation
	const deleteScoreMutation = createMutation(() => ({
		mutationFn: async (scoreId: string) => {
			return gwAdapter.deleteIndividualScore(participationId, scoreId)
		}
	}))

	// Format number with commas
	function formatScore(score: number): string {
		return score.toLocaleString()
	}

	// Parse score string, removing commas
	function parseScore(value: string): number {
		return parseInt(value.replace(/,/g, ''), 10)
	}

	// Get label for a score
	function getScoreLabel(score: GwIndividualScore): string {
		if (score.isCumulative) {
			return 'Total'
		}
		return GW_ROUND_LABELS[score.round as GwRound]
	}

	// Initialize edit values from current scores
	function initializeEditValues() {
		const values: Record<string, string> = {}
		const excused: Record<string, boolean> = {}
		const reasons: Record<string, string> = {}
		for (const score of scores) {
			values[score.id] = formatScore(score.score)
			excused[score.id] = score.excused
			reasons[score.id] = score.excuseReason ?? ''
		}
		editValues = values
		excusedValues = excused
		excuseReasonValues = reasons
		error = null
	}

	// Check if any values have changed
	const hasChanges = $derived.by(() => {
		for (const score of scores) {
			const editedValue = editValues[score.id]
			if (editedValue !== undefined) {
				const newValue = parseScore(editedValue)
				if (!isNaN(newValue) && newValue !== score.score) {
					return true
				}
			}
			// Check excused changes
			if (excusedValues[score.id] !== score.excused) {
				return true
			}
			// Check excuse reason changes
			if (excuseReasonValues[score.id] !== (score.excuseReason ?? '')) {
				return true
			}
		}
		return false
	})

	async function handleSave() {
		isSubmitting = true
		error = null
		try {
			// Update each score that has changed
			for (const score of scores) {
				const editedValue = editValues[score.id]
				const newScoreValue = editedValue !== undefined ? parseScore(editedValue) : score.score
				const newExcused = excusedValues[score.id] ?? score.excused
				const newExcuseReason = excuseReasonValues[score.id] ?? ''

				// Check if anything changed for this score
				const scoreChanged = !isNaN(newScoreValue) && newScoreValue !== score.score
				const excusedChanged = newExcused !== score.excused
				const reasonChanged = newExcuseReason !== (score.excuseReason ?? '')

				if (scoreChanged || excusedChanged || reasonChanged) {
					await updateScoreMutation.mutateAsync({
						scoreId: score.id,
						score: newScoreValue,
						excused: newExcused,
						excuseReason: newExcuseReason
					})
				}
			}
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw', 'event', eventNumber] })
			open = false
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save scores'
		} finally {
			isSubmitting = false
		}
	}

	async function handleDelete(scoreId: string) {
		if (!confirm('Are you sure you want to delete this score?')) return

		try {
			await deleteScoreMutation.mutateAsync(scoreId)
			// Remove from edit values
			const { [scoreId]: _, ...rest } = editValues
			editValues = rest
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw', 'event', eventNumber] })
			// Close modal if no scores left
			if (Object.keys(editValues).length === 0) {
				open = false
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete score'
		}
	}

	async function handleDeleteAll() {
		if (!confirm('Are you sure you want to delete all scores for this player?')) return

		try {
			for (const score of scores) {
				await deleteScoreMutation.mutateAsync(score.id)
			}
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw', 'event', eventNumber] })
			open = false
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete scores'
		}
	}

	function handleCancel() {
		open = false
	}

	// Initialize values when modal opens
	$effect(() => {
		if (open) {
			initializeEditValues()
		}
	})
</script>

<Dialog bind:open>
	<ModalHeader title={playerName} description="Edit score" />

	<ModalBody>
		<div class="edit-content">
			{#if scores.length === 0}
				<p class="empty-message">No scores to edit</p>
			{:else}
				<div class="score-list">
					{#each scores as score (score.id)}
						{#if editValues[score.id] !== undefined}
							<div class="score-entry">
								<Input
									label={getScoreLabel(score)}
									type="text"
									inputmode="numeric"
									bind:value={editValues[score.id]}
									fullWidth
									contained
								/>
								<div class="excused-section">
									<label class="checkbox-row">
										<Checkbox bind:checked={excusedValues[score.id]} size="small" contained />
										<span>Excused?</span>
									</label>
									{#if excusedValues[score.id]}
										<textarea
											class="excuse-textarea"
											bind:value={excuseReasonValues[score.id]}
											placeholder="Excusal reason (optional)"
											rows="2"
										></textarea>
									{/if}
								</div>
							</div>
						{/if}
					{/each}
				</div>
			{/if}

			{#if error}
				<div class="error-message">
					<p>{error}</p>
				</div>
			{/if}
		</div>
	</ModalBody>

	<ModalFooter
		onCancel={handleCancel}
		primaryAction={{
			label: isSubmitting ? 'Saving...' : 'Save',
			onclick: handleSave,
			disabled: isSubmitting || !hasChanges
		}}
	>
		{#snippet left()}
			{#if scores.length === 1}
				<Button
					variant="destructive-ghost"
					onclick={() => handleDelete(scores[0].id)}
					disabled={deleteScoreMutation.isPending}
				>
					Delete score
				</Button>
			{:else if scores.length > 1}
				<Button
					variant="destructive-ghost"
					onclick={handleDeleteAll}
					disabled={deleteScoreMutation.isPending}
				>
					Delete all scores
				</Button>
			{/if}
		{/snippet}
	</ModalFooter>
</Dialog>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.edit-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.empty-message {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		text-align: center;
		padding: spacing.$unit-2x;
	}

	.score-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.score-entry {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding-bottom: spacing.$unit-2x;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);

		&:last-child {
			border-bottom: none;
			padding-bottom: 0;
		}
	}

	.excused-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.checkbox-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		cursor: pointer;
		font-size: typography.$font-regular;
	}

	.excuse-textarea {
		width: 100%;
		padding: calc(spacing.$unit * 1.25) spacing.$unit-2x;
		border: none;
		border-radius: layout.$input-corner;
		font-size: typography.$font-regular;
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
		padding: spacing.$unit;
		background: colors.$error--bg--light;
		border-radius: layout.$item-corner-small;

		p {
			margin: 0;
			font-size: typography.$font-small;
			color: colors.$error;
		}
	}

</style>
