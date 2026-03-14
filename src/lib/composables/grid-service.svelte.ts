import type { PartyMutations } from './party-mutations.svelte'
import type { GridWeapon, GridSummon, GridCharacter } from '$lib/types/api/party'
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'
import * as m from '$lib/paraglide/messages'

export function useGridService(
	mutations: PartyMutations,
	getPartyShortcode: () => string,
	getPartyId: () => string
) {
	return {
		async removeWeapon(partyId: string, gridWeaponId: string, _editKey?: string) {
			try {
				await mutations.grid.deleteWeapon.mutateAsync({
					id: gridWeaponId,
					partyId,
					partyShortcode: getPartyShortcode()
				})
			} catch (err) {
				console.error('Failed to remove weapon:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_remove_weapon()))
				throw err
			}
		},
		async removeSummon(partyId: string, gridSummonId: string, _editKey?: string) {
			try {
				await mutations.grid.deleteSummon.mutateAsync({
					id: gridSummonId,
					partyId,
					partyShortcode: getPartyShortcode()
				})
			} catch (err) {
				console.error('Failed to remove summon:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_remove_summon()))
				throw err
			}
		},
		async removeCharacter(partyId: string, gridCharacterId: string, _editKey?: string) {
			try {
				await mutations.grid.deleteCharacter.mutateAsync({
					id: gridCharacterId,
					partyId,
					partyShortcode: getPartyShortcode()
				})
			} catch (err) {
				console.error('Failed to remove character:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_remove_character()))
				throw err
			}
		},
		async updateWeapon(partyId: string, gridWeaponId: string, updates: Partial<GridWeapon>, _editKey?: string) {
			try {
				await mutations.grid.updateWeapon.mutateAsync({
					id: gridWeaponId,
					partyShortcode: getPartyShortcode(),
					updates
				})
			} catch (err) {
				console.error('Failed to update weapon:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_update_weapon()))
				throw err
			}
		},
		async updateSummon(partyId: string, gridSummonId: string, updates: Partial<GridSummon>, _editKey?: string) {
			try {
				await mutations.grid.updateSummon.mutateAsync({
					id: gridSummonId,
					partyShortcode: getPartyShortcode(),
					updates
				})
			} catch (err) {
				console.error('Failed to update summon:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_update_summon()))
				throw err
			}
		},
		async updateCharacter(
			partyId: string,
			gridCharacterId: string,
			updates: Partial<GridCharacter>,
			_editKey?: string
		) {
			try {
				await mutations.grid.updateCharacter.mutateAsync({
					id: gridCharacterId,
					partyShortcode: getPartyShortcode(),
					updates
				})
			} catch (err) {
				console.error('Failed to update character:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_update_character()))
				throw err
			}
		},
		async switchCharacterStyle(
			gridCharacterId: string,
			_editKey?: string
		) {
			try {
				await mutations.grid.switchCharacterStyle.mutateAsync({
					id: gridCharacterId,
					partyShortcode: getPartyShortcode()
				})
			} catch (err) {
				console.error('Failed to switch character style:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_switch_style()))
				throw err
			}
		},
		async updateCharacterUncap(
			gridCharacterId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		) {
			if (uncapLevel === undefined) return
			try {
				await mutations.grid.updateCharacterUncap.mutateAsync({
					id: gridCharacterId,
					partyId: getPartyId(),
					partyShortcode: getPartyShortcode(),
					uncapLevel,
					transcendenceStep
				})
			} catch (err) {
				console.error('Failed to update character uncap:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_update_uncap()))
				throw err
			}
		},
		async updateWeaponUncap(
			gridWeaponId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		) {
			if (uncapLevel === undefined) return
			try {
				await mutations.grid.updateWeaponUncap.mutateAsync({
					id: gridWeaponId,
					partyId: getPartyId(),
					partyShortcode: getPartyShortcode(),
					uncapLevel,
					transcendenceStep
				})
			} catch (err) {
				console.error('Failed to update weapon uncap:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_update_uncap()))
				throw err
			}
		},
		async duplicateWeapon(gridWeaponId: string, position: number) {
			try {
				await mutations.grid.duplicateWeapon.mutateAsync({
					id: gridWeaponId,
					partyShortcode: getPartyShortcode(),
					position
				})
			} catch (err) {
				console.error('Failed to duplicate weapon:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_duplicate_weapon()))
				throw err
			}
		},
		async duplicateSummon(gridSummonId: string, position: number) {
			try {
				await mutations.grid.duplicateSummon.mutateAsync({
					id: gridSummonId,
					partyShortcode: getPartyShortcode(),
					position
				})
			} catch (err) {
				console.error('Failed to duplicate summon:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_duplicate_summon()))
				throw err
			}
		},
		async updateSummonUncap(
			gridSummonId: string,
			uncapLevel?: number,
			transcendenceStep?: number,
			_editKey?: string
		) {
			if (uncapLevel === undefined) return
			try {
				await mutations.grid.updateSummonUncap.mutateAsync({
					id: gridSummonId,
					partyId: getPartyId(),
					partyShortcode: getPartyShortcode(),
					uncapLevel,
					transcendenceStep
				})
			} catch (err) {
				console.error('Failed to update summon uncap:', err)
				toast.error(extractErrorMessage(err, m.toast_failed_update_uncap()))
				throw err
			}
		}
	}
}

export type GridService = ReturnType<typeof useGridService>
