
<script lang="ts">
	import { createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { gwAdapter } from '$lib/api/adapters/gw.adapter'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import { GW_ROUND_LABELS, type GwCrewScore, type GwRound } from '$lib/types/api/gw'
	import { formatScore, parseScore } from '$lib/utils/gw'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		participationId: string
		eventNumber: string
		round: GwRound
		existingScore?: GwCrewScore | null
	}

	let {
		open = $bindable(false),
		participationId,
		eventNumber,
		round,
		existingScore = null
	}: Props = $props()

	const queryClient = useQueryClient()

	// Form state
	let crewScore = $state('')
	let opponentScore = $state('')
	let opponentName = $state('')
	let opponentCrewId = $state('')
	let isSubmitting = $state(false)
	let error = $state<string | null>(null)

	// Mutations
	const addCrewScoreMutation = createMutation(() => ({
		mutationFn: async () => {
			const score = parseScore(crewScore)
			if (isNaN(score)) throw new Error('Invalid crew score')

			const oppScore = opponentScore ? parseScore(opponentScore) : undefined

			return gwAdapter.addCrewScore(participationId, {
				round,
				crewScore: score,
				opponentScore: oppScore,
				opponentName: opponentName || undefined,
				opponentGranblueId: opponentCrewId || undefined
			})
		}
	}))

	const updateCrewScoreMutation = createMutation(() => ({
		mutationFn: async () => {
			if (!existingScore) throw new Error('No score to update')

			const score = parseScore(crewScore)
			if (isNaN(score)) throw new Error('Invalid crew score')

			const oppScore = opponentScore ? parseScore(opponentScore) : undefined

			return gwAdapter.updateCrewScore(participationId, existingScore.id, {
				crewScore: score,
				opponentScore: oppScore,
				opponentName: opponentName || undefined,
				opponentGranblueId: opponentCrewId || undefined
			})
		}
	}))

	const deleteCrewScoreMutation = createMutation(() => ({
		mutationFn: async () => {
			if (!existingScore) throw new Error('No score to delete')
			return gwAdapter.deleteCrewScore(participationId, existingScore.id)
		}
	}))

	// Initialize form values
	function initializeForm() {
		if (existingScore) {
			crewScore = formatScore(existingScore.crewScore)
			opponentScore = existingScore.opponentScore !== null ? formatScore(existingScore.opponentScore) : ''
			opponentName = existingScore.opponentName ?? ''
			opponentCrewId = existingScore.opponentGranblueId ?? ''
		} else {
			crewScore = ''
			opponentScore = ''
			opponentName = ''
			opponentCrewId = ''
		}
		error = null
	}

	// Check if form has changes
	const hasChanges = $derived.by(() => {
		if (!existingScore) {
			return crewScore.length > 0
		}

		const currentCrewScore = parseScore(crewScore)
		const currentOppScore = opponentScore ? parseScore(opponentScore) : null

		if (currentCrewScore !== existingScore.crewScore) return true
		if (currentOppScore !== existingScore.opponentScore) return true
		if (opponentName !== (existingScore.opponentName ?? '')) return true
		if (opponentCrewId !== (existingScore.opponentGranblueId ?? '')) return true

		return false
	})

	async function handleSave() {
		isSubmitting = true
		error = null
		try {
			if (existingScore) {
				await updateCrewScoreMutation.mutateAsync()
			} else {
				await addCrewScoreMutation.mutateAsync()
			}
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw', 'event', eventNumber] })
			open = false
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save score'
		} finally {
			isSubmitting = false
		}
	}

	async function handleDelete() {
		if (!confirm(m.crew_crew_score_delete())) return

		try {
			await deleteCrewScoreMutation.mutateAsync()
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw', 'event', eventNumber] })
			open = false
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete score'
		}
	}

	function handleCancel() {
		open = false
	}

	// Initialize values when modal opens
	$effect(() => {
		if (open) {
			initializeForm()
		}
	})
</script>

<Dialog bind:open>
	<ModalHeader
		title={GW_ROUND_LABELS[round]}
		description={existingScore ? m.crew_edit_crew_score() : m.crew_add_crew_score()}
	/>

	<ModalBody>
		<div class="form-content">
			<Input
				label={m.crew_crew_score()}
				type="text"
				inputmode="numeric"
				bind:value={crewScore}
				placeholder={m.crew_crew_score_placeholder()}
				fullWidth
				contained
			/>

			<Input
				label={m.crew_opponent_score()}
				type="text"
				inputmode="numeric"
				bind:value={opponentScore}
				placeholder={m.crew_opponent_score_placeholder()}
				fullWidth
				contained
			/>

			<Input
				label={m.crew_opponent_name()}
				type="text"
				bind:value={opponentName}
				placeholder={m.crew_opponent_name_placeholder()}
				fullWidth
				contained
			/>

			<Input
				label={m.crew_opponent_id()}
				type="text"
				bind:value={opponentCrewId}
				placeholder={m.crew_opponent_id_placeholder()}
				fullWidth
				contained
			/>

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
			label: isSubmitting ? m.crew_crew_score_saving() : m.action_save(),
			onclick: handleSave,
			disabled: isSubmitting || !hasChanges || !crewScore
		}}
	>
		{#snippet left()}
			{#if existingScore}
				<Button
					variant="destructive-ghost"
					onclick={handleDelete}
					disabled={deleteCrewScoreMutation.isPending}
				>
					{m.crew_crew_score_delete_button()}
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

	.form-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.error-message {
		padding: spacing.$unit;
		background: var(--danger-bg);
		border-radius: layout.$item-corner-small;

		p {
			margin: 0;
			font-size: typography.$font-small;
			color: var(--danger);
		}
	}
</style>
