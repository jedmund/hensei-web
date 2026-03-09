import type { PartyMutations } from './party-mutations.svelte'
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'

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
				toast.error(extractErrorMessage(err, 'Failed to remove weapon'))
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
				toast.error(extractErrorMessage(err, 'Failed to remove summon'))
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
				toast.error(extractErrorMessage(err, 'Failed to remove character'))
				throw err
			}
		},
		async updateWeapon(partyId: string, gridWeaponId: string, updates: any, _editKey?: string) {
			try {
				await mutations.grid.updateWeapon.mutateAsync({
					id: gridWeaponId,
					partyShortcode: getPartyShortcode(),
					updates
				})
			} catch (err) {
				console.error('Failed to update weapon:', err)
				toast.error(extractErrorMessage(err, 'Failed to update weapon'))
				throw err
			}
		},
		async updateSummon(partyId: string, gridSummonId: string, updates: any, _editKey?: string) {
			try {
				await mutations.grid.updateSummon.mutateAsync({
					id: gridSummonId,
					partyShortcode: getPartyShortcode(),
					updates
				})
			} catch (err) {
				console.error('Failed to update summon:', err)
				toast.error(extractErrorMessage(err, 'Failed to update summon'))
				throw err
			}
		},
		async updateCharacter(
			partyId: string,
			gridCharacterId: string,
			updates: any,
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
				toast.error(extractErrorMessage(err, 'Failed to update character'))
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
				toast.error(extractErrorMessage(err, 'Failed to update uncap level'))
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
				toast.error(extractErrorMessage(err, 'Failed to update uncap level'))
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
				toast.error(extractErrorMessage(err, 'Failed to update uncap level'))
				throw err
			}
		}
	}
}

export type GridService = ReturnType<typeof useGridService>
