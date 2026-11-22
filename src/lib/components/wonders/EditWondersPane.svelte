<script lang="ts">
	/**
	 * EditWondersPane - a team's Wonders, laid out like the profile's
	 * collection: every battle-relevant Wonder on the team, of any element
	 * (teams change element), with no Seals on Unite and Fight teams.
	 *
	 * - Sync from collection replaces the set with the account's collection.
	 * - Tapping a Wonder pushes WonderSetupPane to edit or remove it.
	 * - Add pushes WonderPickerPane with the Wonders the team doesn't have.
	 *
	 * Each change sends the whole set, keeping the Wonders this pane doesn't
	 * show, then returns here.
	 */
	import { untrack } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import { m } from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import WonderCard from './WonderCard.svelte'
	import WonderPickerPane from './WonderPickerPane.svelte'
	import WonderSetupPane from './WonderSetupPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { wonderQueries } from '$lib/api/queries/wonder.queries'
	import { useSyncPartyWonders, useUpdatePartyWonders } from '$lib/api/mutations/wonder.mutations'
	import {
		editableOnTeam,
		groupByCategory,
		joinWonders,
		partyWondersWith,
		partyWondersWithout,
		teamContext,
		teamHiddenReason
	} from '$lib/features/wonders/wonders'
	import { wonderText } from '$lib/features/wonders/labels'
	import { uuid } from '$lib/utils/uuid'
	import type { Party } from '$lib/types/api/party'
	import type { OwnedWonder, PartyWonderInput, Wonder, WonderState } from '$lib/types/api/wonder'
	import { getElementLabel } from '$lib/utils/element'

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		/** Reads the party page's party, so the pane follows each save. */
		getParty: () => Party
	}

	let { paneId, getParty }: Props = $props()

	const party = $derived(getParty())
	const catalogueQuery = createQuery(() => wonderQueries.catalogue())
	const updateMutation = useUpdatePartyWonders(() => party.id)
	const syncMutation = useSyncPartyWonders(() => party.id)

	const context = $derived(teamContext(party))

	/** Why the team page leaves a Wonder out, for its dimmed card's tooltip. */
	function hiddenNote(wonder: Wonder): string | null {
		switch (teamHiddenReason(wonder, context)) {
			case 'element':
				return m.wonders_hidden_element({ element: getElementLabel(wonder.element ?? undefined) })
			case 'characters':
				return m.wonders_hidden_characters()
			default:
				return null
		}
	}
	const shown = $derived(
		catalogueQuery.data
			? joinWonders(party.wonders ?? [], catalogueQuery.data).filter((j) =>
					editableOnTeam(j.wonder, context)
				)
			: []
	)
	const groups = $derived(
		catalogueQuery.data ? groupByCategory(shown, (j) => j.wonder, catalogueQuery.data) : []
	)
	// Each write sends the whole set, built from the cached party: wait for
	// one to land before starting the next
	const busy = $derived(updateMutation.isPending || syncMutation.isPending)
	// Syncing needs an account whose collection to read
	const canSync = $derived(!!party.user)

	let syncConfirmOpen = $state(false)

	/** Sends the set; true once saved. The mutation toasts its own errors. */
	async function write(wonders: PartyWonderInput[]): Promise<boolean> {
		const current = getParty()
		try {
			await updateMutation.mutateAsync({
				partyId: current.id,
				shortcode: current.shortcode,
				wonders
			})
			return true
		} catch {
			return false
		}
	}

	function backHere() {
		if (paneId) sidebar.paneStack.popTo(paneId)
	}

	function openWonder(wonder: Wonder, row: OwnedWonder) {
		if (busy) return
		const name = wonderText(wonder.name)
		sidebar.push({
			id: uuid(),
			title: name,
			component: WonderSetupPane,
			props: {
				wonder,
				row,
				showActive: false,
				onSubmit: async (state: WonderState) => {
					if (!(await write(partyWondersWith(getParty().wonders ?? [], wonder, state)))) return
					toast.success(m.wonders_saved({ name }))
					backHere()
				},
				remove: {
					label: m.context_remove(),
					message: m.remove_unit_confirm_body({ name }),
					onRemove: async () => {
						if (!(await write(partyWondersWithout(getParty().wonders ?? [], wonder.id)))) return
						toast.success(m.wonders_removed({ name }))
						backHere()
					}
				}
			},
			scrollable: true
		})
	}

	function openAdd() {
		const catalogue = catalogueQuery.data
		if (!catalogue || busy) return
		const onTeam = new Set((party.wonders ?? []).map((row) => row.wonderId))
		sidebar.push({
			id: uuid(),
			title: m.wonders_add_title(),
			component: WonderPickerPane,
			props: {
				catalogue,
				candidates: catalogue.wonders.filter(
					(w) => editableOnTeam(w, context) && !onTeam.has(w.id)
				),
				emptyMessage: m.wonders_party_all_added(),
				showActive: false,
				onAdd: async (wonder: Wonder, state: WonderState) => {
					if (!(await write(partyWondersWith(getParty().wonders ?? [], wonder, state)))) return
					toast.success(m.wonders_added({ name: wonderText(wonder.name) }))
					backHere()
				}
			},
			scrollable: true
		})
	}

	/** Replacing Wonders the team has needs a confirmation first. */
	function requestSync() {
		if (busy) return
		if ((party.wonders ?? []).length > 0) syncConfirmOpen = true
		else void sync()
	}

	async function sync() {
		const current = getParty()
		try {
			await syncMutation.mutateAsync({ partyId: current.id, shortcode: current.shortcode })
			toast.success(m.wonders_party_synced())
		} catch {
			// The mutation toasts the API's error
		} finally {
			syncConfirmOpen = false
		}
	}

	$effect(() => {
		const enabled = !!catalogueQuery.data && !busy
		untrack(() => {
			if (paneId) sidebar.setActionForPane(paneId, enabled ? openAdd : undefined, m.action_add())
			else sidebar.setAction(enabled ? openAdd : undefined, m.action_add())
		})
	})
</script>

<div class="wonders-edit">
	{#if canSync}
		<div class="sync">
			<Button
				variant="secondary"
				size="small"
				leftIcon="refresh"
				disabled={busy}
				onclick={requestSync}
			>
				{syncMutation.isPending ? m.party_syncing() : m.party_sync_collection()}
			</Button>
		</div>
	{/if}

	{#if catalogueQuery.data && groups.length === 0}
		<p class="empty-state">{m.wonders_party_none()}</p>
	{/if}

	{#each groups as group (group.category.id)}
		<DetailsSection title={wonderText(group.category.name)}>
			<div class="wonder-grid">
				{#each group.items as { wonder, row } (row.id)}
					<WonderCard
						{wonder}
						{row}
						size={104}
						levelBadge
						hiddenNote={hiddenNote(wonder)}
						onclick={() => openWonder(wonder, row)}
					/>
				{/each}
			</div>
		</DetailsSection>
	{/each}
</div>

{#if canSync}
	<ConfirmDialog
		bind:open={syncConfirmOpen}
		title={m.wonders_party_sync_confirm_title()}
		message={m.wonders_party_sync_confirm_body()}
		confirmLabel={m.party_sync_collection()}
		loading={syncMutation.isPending}
		onconfirm={sync}
	/>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.wonders-edit {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.sync {
		display: flex;
		padding: 0 $unit-2x;
	}

	.empty-state {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-regular;
		color: var(--text-tertiary);
	}

	// The profile's Wonder grid, sized for the sidebar
	.wonder-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
		gap: $unit-2x $unit;
		justify-items: center;
		padding: 0 $unit;
	}
</style>
