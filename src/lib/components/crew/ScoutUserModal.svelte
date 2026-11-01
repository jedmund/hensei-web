<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { useSendInvitation } from '$lib/api/mutations/crew.mutations'
	import { crewQueries } from '$lib/api/queries/crew.queries'
	import { ScoutUserSearch } from '$lib/features/crew/scoutUserSearch.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import ScoutSelectedUser from '$lib/components/crew/scout/ScoutSelectedUser.svelte'
	import ScoutUserCombobox from '$lib/components/crew/scout/ScoutUserCombobox.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		crewId: string
	}

	let { open = $bindable(false), crewId }: Props = $props()

	const sendMutation = useSendInvitation()

	// Query unclaimed phantoms
	const phantomsQuery = createQuery(() => ({
		...crewQueries.members('phantom'),
		enabled: open
	}))

	const unclaimedPhantoms = $derived(phantomsQuery.data?.phantoms?.filter((p) => !p.claimed) ?? [])

	const phantomOptions = $derived(
		unclaimedPhantoms.map((p) => ({
			value: p.id,
			label: p.name,
			suffix: p.granblueId ?? undefined
		}))
	)

	// State
	const search = new ScoutUserSearch()
	let selectedPhantomId = $state<string | undefined>(undefined)
	let inviteSuccess = $state(false)
	let inviteError = $state<string | null>(null)

	const foundUser = $derived(search.foundUser)

	const selectedPhantomName = $derived(
		unclaimedPhantoms.find((p) => p.id === selectedPhantomId)?.name
	)

	function handleSelect(userId: string) {
		search.select(userId)
		inviteError = null
	}

	// Send invitation to the found user
	async function handleInvite() {
		if (!foundUser?.id) return

		inviteError = null
		try {
			await sendMutation.mutateAsync({
				crewId,
				userId: foundUser.id,
				phantomPlayerId: selectedPhantomId
			})
			inviteSuccess = true
			setTimeout(() => {
				resetState()
				open = false
			}, 1500)
		} catch (err) {
			inviteError = err instanceof Error ? err.message : 'Failed to send invitation'
		}
	}

	function resetState() {
		search.reset()
		selectedPhantomId = undefined
		inviteSuccess = false
		inviteError = null
	}

	function clearSelection() {
		search.clearSelection()
		inviteError = null
	}

	function handleCancel() {
		resetState()
		open = false
	}

	$effect(() => {
		if (open) {
			resetState()
		}
	})
</script>

<Dialog bind:open>
	<ModalHeader title={m.crew_scout_title()} description={m.crew_scout_desc()} />

	<ModalBody>
		{#if inviteSuccess}
			<div class="success-message">
				<Icon name="check-circle" size={32} />
				<p>{m.crew_scout_success({ username: foundUser?.username ?? '' })}</p>
				{#if selectedPhantomName}
					<p class="success-detail">{m.crew_scout_phantom_assign({ name: selectedPhantomName })}</p>
				{/if}
			</div>
		{:else}
			<div class="scout-form">
				{#if foundUser}
					<ScoutSelectedUser user={foundUser} onClear={clearSelection} />
				{:else}
					<ScoutUserCombobox {search} onSelect={handleSelect} />
				{/if}

				{#if foundUser}
					{#if inviteError}
						<div class="invite-error">
							<p>{inviteError}</p>
						</div>
					{/if}

					{#if unclaimedPhantoms.length > 0}
						<div class="phantom-section">
							<Select
								label={m.crew_scout_assign_phantom()}
								options={phantomOptions}
								bind:value={selectedPhantomId}
								placeholder={m.crew_scout_none()}
								fullWidth
								contained
								portal
							/>
							<span class="phantom-hint">{m.crew_scout_assign_later()}</span>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
	</ModalBody>

	{#if !inviteSuccess}
		<ModalFooter
			onCancel={handleCancel}
			primaryAction={foundUser
				? {
						label: sendMutation.isPending ? m.crew_scout_sending() : m.crew_scout_send(),
						onclick: handleInvite,
						disabled: sendMutation.isPending
					}
				: undefined}
		/>
	{/if}
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.scout-form {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.invite-error {
		padding: $unit;
		background: var(--danger-bg);
		border-radius: $item-corner-small;

		p {
			margin: 0;
			font-size: $font-small;
			color: var(--danger);
		}
	}

	.phantom-hint {
		display: block;
		font-size: $font-small;
		color: var(--text-secondary);
		margin-top: $unit-half;
	}

	.success-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit;
		padding: $unit-4x;
		text-align: center;
		color: var(--wind-nav-selected-text);

		p {
			margin: 0;
		}

		.success-detail {
			font-size: $font-small;
			color: var(--text-secondary);
		}
	}
</style>
