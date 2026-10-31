import type { Party } from '$lib/types/api/party'
import type { RaidFull } from '$lib/types/api/raid'
import { openEditSolomonisPane } from '$lib/components/solomonis/party/openSolomonisPanes'
import {
	isSolomonisParty,
	solomonisRaidTransition,
	type SolomonisRaidTransition
} from '$lib/components/solomonis/party/solomonisParty'
import {
	useUpdatePartyBlessings,
	useUpdateSolomonisExpedition
} from '$lib/api/mutations/solomonis.mutations'

type RaidLike = Parameters<typeof solomonisRaidTransition>[1] & { id?: string }

interface SolomonisRaidOptions {
	getParty: () => Party
	updateRaid: (raidId: string | null) => Promise<void>
	ensurePartyExists?: (() => Promise<{ id: string; shortcode: string }>) | undefined
}

/**
 * Raid tile and settings pane: entering or leaving Evoking Solomonis goes
 * through here (D12). Entering opens the expedition pane; leaving asks first,
 * since it deletes the party's Solomonis data.
 */
export function useSolomonisRaid(opts: SolomonisRaidOptions) {
	const isSolomonis = $derived(isSolomonisParty(opts.getParty()))
	const mutations = {
		expedition: useUpdateSolomonisExpedition(),
		blessings: useUpdatePartyBlessings(() => opts.getParty().id)
	}
	let leaveOpen = $state(false)
	let pendingLeaveRaidId = $state<string | null>(null)

	function startTransition(transition: SolomonisRaidTransition, raidId: string | null) {
		if (transition === 'enter') {
			openEditSolomonisPane(opts.getParty(), mutations, opts.ensurePartyExists)
		} else if (transition === 'leave') {
			pendingLeaveRaidId = raidId
			leaveOpen = true
		}
	}

	/** For the settings pane. Returns true when the raid change is ours to handle. */
	function handleRaidChange(raid: RaidLike | null | undefined): boolean {
		// The settings pane closes right after saving; open our pane after it.
		const transition = solomonisRaidTransition(isSolomonis, raid)
		if (transition === 'none') return false
		setTimeout(() => startTransition(transition, raid?.id ?? null))
		return true
	}

	async function handleRaidSelect(raid: RaidFull | null) {
		const transition = solomonisRaidTransition(isSolomonis, raid)
		if (transition !== 'none') {
			startTransition(transition, raid?.id ?? null)
			return
		}
		await opts.updateRaid(raid?.id ?? null)
	}

	async function confirmLeave() {
		leaveOpen = false
		await opts.updateRaid(pendingLeaveRaidId)
	}

	return {
		get isSolomonis() {
			return isSolomonis
		},
		get leaveOpen() {
			return leaveOpen
		},
		set leaveOpen(v: boolean) {
			leaveOpen = v
		},
		handleRaidChange,
		handleRaidSelect,
		confirmLeave
	}
}

export type SolomonisRaid = ReturnType<typeof useSolomonisRaid>
