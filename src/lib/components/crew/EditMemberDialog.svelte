<script lang="ts">
	import type { CrewMembership, PhantomPlayer } from '$lib/types/api/crew'
	import { useQueryClient } from '@tanstack/svelte-query'
	import { crewAdapter } from '$lib/api/adapters/crew.adapter'
	import { useUpdateMembership } from '$lib/api/mutations/crew.mutations'
	import { crewStore } from '$lib/stores/crew.store.svelte'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import DatePicker from '$lib/components/ui/DatePicker.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import Switch from '$lib/components/ui/switch/Switch.svelte'
	import MembershipHistoryEditor from '$lib/components/crew/MembershipHistoryEditor.svelte'
	import type { EditableMembershipPeriod } from '$lib/components/crew/MembershipHistoryEditor.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		member: CrewMembership | null
		phantom: PhantomPlayer | null
		onClose: () => void
		onSaved: () => void
	}

	let { member, phantom, onClose, onSaved }: Props = $props()

	const queryClient = useQueryClient()
	const updateMembershipMutation = useUpdateMembership()

	// Dialog open state derived from props
	let open = $state(false)

	// Edit form state
	let editJoinDate = $state('')
	let editRetired = $state(false)
	let editRetiredAt = $state('')
	let editGranblueId = $state('')

	// Membership history for boomerang players
	let membershipHistory = $state<EditableMembershipPeriod[]>([])
	let loadingHistory = $state(false)

	// React to member/phantom prop changes
	$effect(() => {
		if (member) {
			editJoinDate = member.joinedAt ? (member.joinedAt.split('T')[0] ?? '') : ''
			editRetired = member.retired
			editRetiredAt = member.retiredAt ? (member.retiredAt.split('T')[0] ?? '') : ''
			editGranblueId = ''
			membershipHistory = []
			open = true
			fetchHistory(member)
		} else if (phantom) {
			editJoinDate = phantom.joinedAt ? (phantom.joinedAt.split('T')[0] ?? '') : ''
			editRetired = phantom.retired
			editRetiredAt = phantom.retiredAt ? (phantom.retiredAt.split('T')[0] ?? '') : ''
			editGranblueId = phantom.granblueId ?? ''
			membershipHistory = []
			open = true
		} else {
			open = false
		}
	})

	// Handle dialog close (e.g. clicking overlay)
	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			open = false
			onClose()
		}
	}

	async function fetchHistory(m: CrewMembership) {
		if (!crewStore.crew || !m.user?.id) return

		loadingHistory = true
		try {
			const history = await crewAdapter.getMembershipHistory(crewStore.crew.id, m.user.id)
			if (history.length > 1) {
				membershipHistory = history.map((h) => ({
					id: h.id,
					joinedAt: h.joinedAt ? (h.joinedAt.split('T')[0] ?? '') : '',
					retiredAt: h.retiredAt ? (h.retiredAt.split('T')[0] ?? '') : '',
					retired: h.retired
				}))
			}
		} catch (error) {
			console.error('Failed to fetch membership history:', error)
			toast.error(extractErrorMessage(error, 'Failed to load history'))
		}
		loadingHistory = false
	}

	async function handleSave() {
		if (!crewStore.crew) return

		try {
			if (member) {
				if (membershipHistory.length > 1) {
					for (const period of membershipHistory) {
						await updateMembershipMutation.mutateAsync({
							crewId: crewStore.crew.id,
							membershipId: period.id,
							input: {
								joinedAt: period.joinedAt,
								retired: period.retired,
								retiredAt: period.retired ? period.retiredAt || undefined : undefined
							}
						})
					}
				} else {
					await updateMembershipMutation.mutateAsync({
						crewId: crewStore.crew.id,
						membershipId: member.id,
						input: {
							joinedAt: editJoinDate,
							retired: editRetired,
							retiredAt: editRetired ? editRetiredAt || undefined : undefined
						}
					})
				}
			} else if (phantom) {
				await crewAdapter.updatePhantom(crewStore.crew.id, phantom.id, {
					joinedAt: editJoinDate,
					retired: editRetired,
					retiredAt: editRetired ? editRetiredAt || undefined : undefined,
					granblueId: editGranblueId || undefined
				})
				onSaved()
			}
			queryClient.invalidateQueries({ queryKey: ['crew', 'gw'] })
		} catch (error) {
			console.error('Failed to update:', error)
			toast.error(extractErrorMessage(error, 'Failed to update member'))
		}

		open = false
		onClose()
	}

	const saveDisabled = $derived(
		membershipHistory.length > 1 ? !membershipHistory[0]?.joinedAt : !editJoinDate
	)
</script>

<Dialog bind:open onOpenChange={handleOpenChange}>
	{#snippet children()}
		<ModalHeader title={m.crew_edit_player()} />

		<ModalBody>
			<div class="modal-form">
				<div class="form-fields">
					{#if phantom}
						<Input
							label={m.crew_granblue_id()}
							bind:value={editGranblueId}
							maxLength={20}
							variant="contained"
						/>
					{/if}

					{#if loadingHistory}
						<p class="loading-text">{m.crew_membership_loading()}</p>
					{:else if membershipHistory.length > 1}
						<MembershipHistoryEditor
							bind:periods={membershipHistory}
							{editRetired}
							onRetiredChange={(checked) => (editRetired = checked)}
						/>
					{:else}
						<!-- Single membership period (normal case) -->
						<DatePicker label={m.crew_join_date()} bind:value={editJoinDate} contained />
						<p class="help-text">
							{m.crew_join_date_hint()}
						</p>
						<SettingsRow title={m.crew_retired()} subtitle={m.crew_retired_hint()}>
							{#snippet control()}
								<Switch bind:checked={editRetired} name="retired" />
							{/snippet}
						</SettingsRow>
						{#if editRetired}
							<DatePicker label={m.crew_retired_date()} bind:value={editRetiredAt} contained />
							<p class="help-text">
								{m.crew_retired_date_hint()}
							</p>
						{/if}
					{/if}
				</div>
			</div>
		</ModalBody>

		<ModalFooter
			onCancel={() => { open = false; onClose() }}
			primaryAction={{
				label: m.crew_save_button(),
				onclick: handleSave,
				disabled: saveDisabled
			}}
		/>
	{/snippet}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.modal-form {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.form-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	:global(fieldset) {
		border: none;
		padding: 0;
		margin: 0;
	}

	.help-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
		line-height: 1.4;
	}

	.loading-text {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		margin: 0;
		font-style: italic;
	}
</style>
