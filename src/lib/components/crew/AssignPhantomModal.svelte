<svelte:options runes={true} />

<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { useAssignPhantom } from '$lib/api/mutations/crew.mutations'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import type { PhantomPlayer, CrewMembership } from '$lib/types/api/crew'

	interface Props {
		open: boolean
		crewId: string
		phantom: PhantomPlayer | null
	}

	let { open = $bindable(false), crewId, phantom }: Props = $props()

	const assignMutation = useAssignPhantom()

	// Query for active crew members
	const membersQuery = createQuery(() => ({
		...crewQueries.members('active'),
		enabled: open
	}))

	// State
	let selectedMemberId = $state<string | null>(null)
	let assignSuccess = $state(false)
	let assignError = $state<string | null>(null)

	// Get active members (excluding those who already have scores - per requirement)
	const availableMembers = $derived(
		membersQuery.data?.members?.filter((m) => !m.retired) ?? []
	)

	// Assign phantom to selected member
	async function handleAssign() {
		if (!phantom || !selectedMemberId) return

		const selectedMember = availableMembers.find((m) => m.id === selectedMemberId)
		if (!selectedMember?.user?.id) return

		assignError = null
		try {
			await assignMutation.mutateAsync({
				crewId,
				phantomId: phantom.id,
				userId: selectedMember.user.id
			})
			assignSuccess = true
			setTimeout(() => {
				resetState()
				open = false
			}, 1500)
		} catch (err) {
			assignError = err instanceof Error ? err.message : 'Failed to assign phantom'
		}
	}

	function resetState() {
		selectedMemberId = null
		assignSuccess = false
		assignError = null
	}

	function handleCancel() {
		resetState()
		open = false
	}

	// Reset state when modal opens
	$effect(() => {
		if (open) {
			resetState()
		}
	})
</script>

<Dialog bind:open>
	<ModalHeader
		title="Assign Phantom"
		description={phantom ? `Assign "${phantom.name}" to a crew member` : 'Select a crew member'}
	/>

	<ModalBody>
		{#if assignSuccess}
			<div class="success-message">
				<Icon name="check-circle" size={32} />
				<p>Phantom assigned successfully!</p>
			</div>
		{:else if membersQuery.isLoading}
			<div class="loading-state">
				<p>Loading members...</p>
			</div>
		{:else if availableMembers.length === 0}
			<div class="empty-state">
				<p>No crew members available to assign.</p>
			</div>
		{:else}
			<div class="members-list">
				{#each availableMembers as member}
					<button
						type="button"
						class="member-option"
						class:selected={selectedMemberId === member.id}
						onclick={() => (selectedMemberId = member.id)}
					>
						<span class="member-username">{member.user?.username ?? 'Unknown'}</span>
						{#if selectedMemberId === member.id}
							<Icon name="check" size={16} />
						{/if}
					</button>
				{/each}
			</div>

			{#if assignError}
				<div class="assign-error">
					<p>{assignError}</p>
				</div>
			{/if}
		{/if}
	</ModalBody>

	{#if !assignSuccess}
		<ModalFooter
			onCancel={handleCancel}
			primaryAction={selectedMemberId
				? {
						label: assignMutation.isPending ? 'Assigning...' : 'Assign',
						onclick: handleAssign,
						disabled: assignMutation.isPending
					}
				: undefined}
		/>
	{/if}
</Dialog>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.loading-state,
	.empty-state {
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.members-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		max-height: 300px;
		overflow-y: auto;
	}

	.member-option {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: none;
		border: 1px solid var(--border-color);
		border-radius: layout.$item-corner;
		cursor: pointer;
		transition:
			background-color 0.15s,
			border-color 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.03);
		}

		&.selected {
			background: var(--color-blue-light, #dbeafe);
			border-color: var(--color-blue-dark, #1e40af);
		}
	}

	.member-username {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.assign-error {
		margin-top: spacing.$unit-2x;
		padding: spacing.$unit;
		background: colors.$error--bg--light;
		border-radius: layout.$item-corner-small;

		p {
			margin: 0;
			font-size: typography.$font-small;
			color: colors.$error;
		}
	}

	.success-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit-4x;
		text-align: center;
		color: colors.$wind-text-20;

		p {
			margin: 0;
		}
	}
</style>
