<script lang="ts">
	/**
	 * EditPartyPane - Edit party metadata (settings, performance, video)
	 *
	 * This pane is opened via openPartyEditSidebar() and provides
	 * editing for battle settings, clear time, metrics, video URL, and raid.
	 */
	import * as m from '$lib/paraglide/messages'
	import BattleSettingsSection from '$lib/components/party/edit/BattleSettingsSection.svelte'
	import PartyDetailsFields from '$lib/components/party/edit/PartyDetailsFields.svelte'
	import PartyVisibilitySection from '$lib/components/party/edit/PartyVisibilitySection.svelte'
	import PartyPerformanceSection from '$lib/components/party/edit/PartyPerformanceSection.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import EditDescriptionPane from '$lib/components/sidebar/EditDescriptionPane.svelte'
	import SolomonisDetailsPane from '$lib/components/solomonis/party/SolomonisDetailsPane.svelte'
	import StickerBreakdownSection from '$lib/components/stickers/StickerBreakdownSection.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { page } from '$app/stores'
	import { usePaneStack } from '$lib/stores/paneStack.svelte'
	import { untrack } from 'svelte'
	import {
		partyEditValuesChanged,
		raidFullToRaid,
		type PartyEditValues,
		type SolomonisDetailsLink
	} from '$lib/features/party/partyEditValues'
	import type { Raid } from '$lib/types/api/entities'
	import type { RaidFull } from '$lib/types/api/raid'
	import type { PartyVisibility } from '$lib/types/visibility'
	import type { StickerBreakdownEntry } from '$lib/types/api/sticker'

	type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		/** Pane ID injected by PaneStack for targeted action updates */
		paneId?: string
		/** Current party values */
		initialValues: PartyEditValues
		/** Party element for switch theming (fallback, prefer reactive derivation) */
		element?: ElementType
		/** Callback when save is requested */
		onSave?: (values: PartyEditValues) => void
		/** Callback to save description independently (server-side) */
		onDescriptionSave?: (content: string) => Promise<void>
		/** Evoking Solomonis parties: a row under Raid that opens the details pane */
		solomonisDetails?: SolomonisDetailsLink
		/** The owner's private sticker counts; absent for anyone but the owner */
		stickerBreakdown?: StickerBreakdownEntry[] | undefined
	}

	let {
		paneId,
		initialValues,
		element: elementProp,
		onSave,
		onDescriptionSave,
		solomonisDetails,
		stickerBreakdown
	}: Props = $props()

	// Derive element reactively from the user cookie (updates after settings save via invalidateAll)
	const element = $derived(
		($page.data?.currentUser?.element as ElementType | undefined) ?? elementProp
	)

	// Get the pane stack for pushing EditRaidPane
	const paneStack = usePaneStack()

	// Snapshot initial values at mount time to avoid proxy/reactivity issues.
	// Props passed through PaneStack's $state are wrapped in deep reactive proxies.
	// Reading initialValues.xxx in $derived creates tracking dependencies on the proxy,
	// which can be invalidated when setAction mutates the pane object.
	// $state.snapshot() produces a plain non-reactive copy, breaking that chain.
	const initial = untrack(() => $state.snapshot(initialValues)) as PartyEditValues

	// Local state - initialized from snapshot
	let name = $state(initial.name)
	let visibility = $state<PartyVisibility>(initial.visibility)
	let sharedWithCrew = $state(initial.sharedWithCrew)
	let fullAuto = $state(initial.fullAuto)
	let solo = $state(initial.solo)
	let autoGuard = $state(initial.autoGuard)
	let autoSummon = $state(initial.autoSummon)
	let chargeAttack = $state(initial.chargeAttack)
	let clearTime = $state(initial.clearTime)
	let buttonCount = $state(initial.buttonCount)
	let chainCount = $state(initial.chainCount)
	let summonCount = $state(initial.summonCount)
	let videoUrl = $state(initial.videoUrl)
	let raid = $state<Raid | null>(initial.raid)
	let raidId = $state<string | null>(initial.raidId)
	let description = $state(initial.description)

	function currentValues(): PartyEditValues {
		return {
			name,
			description,
			visibility,
			sharedWithCrew,
			fullAuto,
			solo,
			autoGuard,
			autoSummon,
			chargeAttack,
			clearTime,
			buttonCount,
			chainCount,
			summonCount,
			videoUrl,
			raid,
			raidId
		}
	}

	// Check if any values have changed (compared against snapshot, not proxy)
	const hasChanges = $derived(partyEditValuesChanged(initial, currentValues()))

	// Expose save function for sidebar action button
	export function save() {
		onSave?.(currentValues())
		sidebar.close()
	}

	// Update sidebar action button state based on changes.
	// Uses setActionForPane to target this pane by ID, so the action is set
	// correctly even when another pane (e.g. EditRaidPane) is on top.
	// IMPORTANT: paneId must be read inside untrack() to avoid an infinite loop —
	// updatePaneAt creates a new panes array, which re-spreads component props,
	// which would re-trigger this effect if paneId were tracked.
	$effect(() => {
		const changed = hasChanges
		const el = element // Track element reactively so button color updates
		untrack(() => {
			if (paneId) {
				sidebar.setActionForPane(paneId, changed ? save : undefined, m.action_save(), el)
				sidebar.paneStack.updatePaneById(paneId, {
					hasUnsavedChanges: () => hasChanges
				})
			} else {
				if (changed) {
					sidebar.setAction(save, m.action_save(), el)
				} else {
					sidebar.setAction(undefined, m.action_save(), el)
				}
			}
		})
	})

	function handleSettingsChange(
		field: 'fullAuto' | 'solo' | 'autoGuard' | 'autoSummon' | 'chargeAttack',
		value: boolean
	) {
		if (field === 'fullAuto') fullAuto = value
		else if (field === 'solo') solo = value
		else if (field === 'autoGuard') autoGuard = value
		else if (field === 'autoSummon') autoSummon = value
		else chargeAttack = value
	}

	function openRaidPane() {
		paneStack.push({
			id: 'edit-raid',
			title: m.pane_select_raid(),
			component: EditRaidPane,
			props: {
				currentRaid: raid,
				onSelect: handleRaidSelected
			},
			scrollable: true
		})
	}

	function handleRaidSelected(selectedRaid: RaidFull | null) {
		if (selectedRaid) {
			raid = raidFullToRaid(selectedRaid)
			raidId = selectedRaid.id
		} else {
			raid = null
			raidId = null
		}
		paneStack.pop()
	}

	// Only while the raid is still the Solomonis zone the party was opened with
	const showSolomonisDetails = $derived(!!solomonisDetails && raidId === initial.raidId)

	function openSolomonisDetailsPane() {
		if (!solomonisDetails) return
		paneStack.push({
			id: 'solomonis-details',
			title: solomonisDetails.label,
			component: SolomonisDetailsPane,
			props: { getParty: solomonisDetails.getParty, canEdit: solomonisDetails.canEdit },
			scrollable: true
		})
	}

	function openDescriptionPane() {
		paneStack.push({
			id: 'edit-description',
			title: m.pane_edit_description(),
			component: EditDescriptionPane,
			props: {
				description,
				onSave: async (content: string) => {
					if (onDescriptionSave) {
						await onDescriptionSave(content)
					}
					description = content
					paneStack.pop()
				}
			},
			scrollable: false,
			persistOnTabSwitch: true
		})
	}
</script>

<div class="party-edit-sidebar">
	<PartyDetailsFields
		bind:name
		bind:videoUrl
		{raid}
		{description}
		solomonisDetails={showSolomonisDetails ? solomonisDetails : undefined}
		onRaidClick={openRaidPane}
		onSolomonisClick={openSolomonisDetailsPane}
		onDescriptionClick={openDescriptionPane}
	/>

	<hr class="divider" />

	<PartyVisibilitySection bind:visibility bind:sharedWithCrew {element} />

	<hr class="divider" />

	<BattleSettingsSection
		bind:fullAuto
		bind:solo
		bind:autoGuard
		bind:autoSummon
		bind:chargeAttack
		{element}
		onchange={handleSettingsChange}
	/>

	<hr class="divider" />

	<PartyPerformanceSection bind:clearTime bind:buttonCount bind:chainCount bind:summonCount />

	{#if stickerBreakdown}
		<hr class="divider" />
		<StickerBreakdownSection breakdown={stickerBreakdown} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	.party-edit-sidebar {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding-bottom: $unit-2x;
	}

	.divider {
		border: none;
		border-top: 1px solid var(--border-subtle);
		margin: 0;
	}
</style>
