import type { PartyMutations } from './party-mutations.svelte'
import type { Party } from '$lib/types/api/party'
import type { UpdatePartyParams } from '$lib/api/adapters/party.adapter'
import { openDescriptionPane } from '$lib/features/description/openDescriptionPane.svelte'
import {
	openPartyEditSidebar,
	type PartyEditValues
} from '$lib/features/party/openPartyEditSidebar.svelte'
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'

type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

interface PartyActionsOptions {
	mutations: PartyMutations
	getParty: () => Party
	canEdit: () => boolean
	getAuthUserId: () => string | undefined
	getUserElement: () => ElementType | undefined
	getHasCollectionLinks: () => boolean
}

export function usePartyActions(opts: PartyActionsOptions) {
	let loading = $state(false)
	let error = $state<string | null>(null)
	let deleteDialogOpen = $state(false)
	let deleting = $state(false)

	async function updatePartyDetails(updates: Omit<UpdatePartyParams, 'id' | 'shortcode'>) {
		if (!opts.canEdit()) return

		const party = opts.getParty()
		loading = true
		error = null

		try {
			await opts.mutations.party.update.mutateAsync({
				id: party.id,
				shortcode: party.shortcode,
				...updates
			})
		} catch (err: any) {
			error = err.message || 'Failed to update party'
		} finally {
			loading = false
		}
	}

	async function toggleFavorite() {
		const authUserId = opts.getAuthUserId()
		if (!authUserId) return

		const party = opts.getParty()
		loading = true
		error = null

		try {
			if (party.favorited) {
				await opts.mutations.party.unfavorite.mutateAsync(party.shortcode)
			} else {
				await opts.mutations.party.favorite.mutateAsync(party.shortcode)
			}
		} catch (err: any) {
			error = err.message || 'Failed to update favorite status'
		} finally {
			loading = false
		}
	}

	async function remixParty() {
		const party = opts.getParty()
		loading = true
		error = null

		try {
			const newParty = await opts.mutations.party.remix.mutateAsync(party.shortcode)
			window.location.href = `/teams/${newParty.shortcode}`
		} catch (err: any) {
			error = err.message || 'Failed to remix party'
		} finally {
			loading = false
		}
	}

	async function deleteParty() {
		const party = opts.getParty()
		const authUserId = opts.getAuthUserId()
		if (party.user?.id !== authUserId) return

		try {
			deleting = true
			error = null

			await opts.mutations.party.delete.mutateAsync({
				id: party.id,
				shortcode: party.shortcode
			})

			if (party.user?.username) {
				window.location.href = `/${party.user.username}`
			} else {
				window.location.href = '/me'
			}
		} catch (err: any) {
			error = err.message || 'Failed to delete party'
			deleteDialogOpen = false
		} finally {
			deleting = false
		}
	}

	async function syncFromCollection() {
		if (!opts.canEdit() || !opts.getHasCollectionLinks()) return

		const party = opts.getParty()
		loading = true
		error = null

		try {
			await opts.mutations.grid.syncAllItems.mutateAsync({
				partyId: party.id,
				partyShortcode: party.shortcode
			})
		} catch (err: any) {
			error = err.message || 'Failed to sync from collection'
		} finally {
			loading = false
		}
	}

	async function handleUnlinkCollection() {
		if (!opts.canEdit()) return

		const party = opts.getParty()
		try {
			await opts.mutations.grid.unlinkCollectionSource.mutateAsync({
				partyId: party.id,
				partyShortcode: party.shortcode
			})
		} catch (err: any) {
			error = err.message || 'Failed to unlink collection'
		}
	}

	function openDescriptionPanel() {
		const party = opts.getParty()
		openDescriptionPane({
			title: party.name || '(untitled party)',
			description: party.description,
			videoUrl: party.videoUrl,
			canEdit: opts.canEdit(),
			partyId: party.id,
			partyShortcode: party.shortcode,
			onSave: async (description) => {
				await updatePartyDetails({ description })
			}
		})
	}

	function openSettingsPanel() {
		if (!opts.canEdit()) return

		const party = opts.getParty()
		const isSharedWithCrew = party.shares?.some((s) => s.shareableType === 'crew') ?? false

		const initialValues: PartyEditValues = {
			name: party.name ?? '',
			description: party.description ?? null,
			visibility: party.visibility ?? 1,
			sharedWithCrew: isSharedWithCrew,
			fullAuto: party.fullAuto ?? false,
			autoGuard: party.autoGuard ?? false,
			autoSummon: party.autoSummon ?? false,
			chargeAttack: party.chargeAttack ?? true,
			clearTime: party.clearTime ?? null,
			buttonCount: party.buttonCount ?? null,
			chainCount: party.chainCount ?? null,
			summonCount: party.summonCount ?? null,
			videoUrl: party.videoUrl ?? null,
			raid: party.raid ?? null,
			raidId: party.raid?.id ?? null
		}

		openPartyEditSidebar({
			initialValues,
			element: opts.getUserElement(),
			onSave: async (values) => {
				await updatePartyDetails({
					name: values.name,
					description: values.description ?? undefined,
					visibility: values.visibility,
					fullAuto: values.fullAuto,
					autoGuard: values.autoGuard,
					autoSummon: values.autoSummon,
					chargeAttack: values.chargeAttack,
					clearTime: values.clearTime,
					buttonCount: values.buttonCount,
					chainCount: values.chainCount,
					summonCount: values.summonCount,
					videoUrl: values.videoUrl,
					raidId: values.raidId
				})

				// Handle crew share toggle
				const wasShared = party.shares?.some((s) => s.shareableType === 'crew') ?? false
				if (values.sharedWithCrew && !wasShared) {
					try {
						await opts.mutations.party.shareWithCrew.mutateAsync({
							partyId: party.id,
							shortcode: party.shortcode
						})
					} catch (err: any) {
						console.error('Failed to share with crew:', err)
						toast.error(extractErrorMessage(err, 'Failed to share with crew'))
					}
				} else if (!values.sharedWithCrew && wasShared) {
					const share = party.shares?.find((s) => s.shareableType === 'crew')
					if (share) {
						try {
							await opts.mutations.party.removeShare.mutateAsync({
								partyId: party.id,
								shareId: share.id,
								shortcode: party.shortcode
							})
						} catch (err: any) {
							console.error('Failed to remove share:', err)
							toast.error(extractErrorMessage(err, 'Failed to remove crew share'))
						}
					}
				}
			}
		})
	}

	return {
		get loading() {
			return loading
		},
		get error() {
			return error
		},
		set error(v: string | null) {
			error = v
		},
		get deleteDialogOpen() {
			return deleteDialogOpen
		},
		set deleteDialogOpen(v: boolean) {
			deleteDialogOpen = v
		},
		get deleting() {
			return deleting
		},
		get isSyncingAll() {
			return opts.mutations.grid.syncAllItems.isPending
		},
		updatePartyDetails,
		toggleFavorite,
		remixParty,
		deleteParty,
		syncFromCollection,
		handleUnlinkCollection,
		openDescriptionPanel,
		openSettingsPanel
	}
}

export type PartyActions = ReturnType<typeof usePartyActions>
