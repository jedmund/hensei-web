<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { useLeaveCrew } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { extractErrorMessage } from '$lib/utils/errors'
	import Button from '$lib/components/ui/Button.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import TransferCaptainDialog from '$lib/components/crew/TransferCaptainDialog.svelte'
	import type { CrewMembership } from '$lib/types/api/crew'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/** Called after the user has left the crew */
		onLeft: () => void
	}

	let { onLeft }: Props = $props()

	const leaveCrewMutation = useLeaveCrew()

	// Members a captain can hand the crew to: everyone active except themselves
	const membersQuery = createQuery(() => ({
		...crewQueries.members('active'),
		enabled: crewStore.isCaptain
	}))
	const transferCandidates = $derived(
		membersQuery.data?.members.filter((member) => member.role !== 'captain' && !member.retired) ??
			[]
	)
	const transferOptions = $derived(
		transferCandidates.flatMap((member) =>
			member.user
				? [{ value: member.user.id, label: member.user.displayName || member.user.username }]
				: []
		)
	)

	let selectedUserId = $state<string | undefined>(undefined)
	let transferMember = $state<CrewMembership | null>(null)
	let leaveConfirmOpen = $state(false)

	const crewName = $derived(crewStore.crew?.name ?? '')

	// Choosing a member opens the transfer confirmation, which asks for the
	// crew's name before anything changes
	function chooseTransferMember(userId: string | undefined) {
		selectedUserId = userId
		transferMember = transferCandidates.find((member) => member.user?.id === userId) ?? null
	}

	async function handleLeave() {
		try {
			await leaveCrewMutation.mutateAsync()
			toast.success(m.crew_leave_success({ name: crewName }))
			leaveConfirmOpen = false
			crewStore.clear()
			onLeft()
		} catch (error) {
			toast.error(extractErrorMessage(error, m.crew_leave_failed()))
		}
	}
</script>

<div class="membership">
	{#if crewStore.isCaptain}
		<SettingsRow title={m.crew_transfer_captain()} subtitle={m.crew_transfer_desc()}>
			{#snippet control()}
				{#if membersQuery.isSuccess && transferOptions.length === 0}
					<span class="hint">{m.crew_transfer_no_members()}</span>
				{:else}
					<Select
						options={transferOptions}
						value={selectedUserId}
						onValueChange={chooseTransferMember}
						placeholder={m.crew_transfer_select_placeholder()}
						ariaLabel={m.crew_transfer_select_placeholder()}
						disabled={!membersQuery.isSuccess}
						size="small"
						contained
						fullWidth
						portal
					/>
				{/if}
			{/snippet}
		</SettingsRow>
	{/if}

	<SettingsRow
		title={m.crew_leave()}
		subtitle={crewStore.canLeaveCrew ? m.crew_leave_desc() : m.crew_leave_must_transfer()}
		compact
	>
		{#snippet control()}
			<Button
				variant="destructive"
				size="small"
				disabled={!crewStore.canLeaveCrew}
				onclick={() => (leaveConfirmOpen = true)}
			>
				{m.crew_leave()}
			</Button>
		{/snippet}
	</SettingsRow>
</div>

<ConfirmDialog
	bind:open={leaveConfirmOpen}
	title={m.crew_leave()}
	message={m.crew_leave_confirm({ name: crewName })}
	confirmLabel={m.crew_leave()}
	confirmVariant="destructive"
	loading={leaveCrewMutation.isPending}
	onconfirm={handleLeave}
/>

<TransferCaptainDialog
	member={transferMember}
	onClose={() => {
		transferMember = null
		selectedUserId = undefined
	}}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.membership {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.hint {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}
</style>
