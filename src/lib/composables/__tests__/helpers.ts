/**
 * Shared test helpers for composable tests
 *
 * Provides mock mutation factories that mirror the PartyMutations shape.
 * Each mutation is a vi.fn() with a `mutateAsync` method, plus common
 * TanStack Query properties like `isPending`.
 */

import { vi } from 'vitest'
import type { PartyMutations } from '../party-mutations.svelte'
import { MOCK_PARTY } from '$lib/api/mutations/__tests__/fixtures'
import type { Party } from '$lib/types/api/party'

/** Creates a mock mutation object matching TanStack Query's UseMutationResult shape */
function mockMutation(resolvedValue: unknown = {}) {
	return {
		mutateAsync: vi.fn().mockResolvedValue(resolvedValue),
		isPending: false,
		isError: false,
		isSuccess: false,
		reset: vi.fn()
	}
}

/** Creates a full mock PartyMutations object with all mutations as vi.fn() */
export function createMockMutations(): PartyMutations {
	return {
		grid: {
			createWeapon: mockMutation(),
			createCharacter: mockMutation(),
			createSummon: mockMutation(),
			deleteWeapon: mockMutation(),
			deleteCharacter: mockMutation(),
			deleteSummon: mockMutation(),
			updateWeapon: mockMutation(),
			updateCharacter: mockMutation(),
			updateSummon: mockMutation(),
			updateWeaponUncap: mockMutation(),
			updateCharacterUncap: mockMutation(),
			updateSummonUncap: mockMutation(),
			swapWeapons: mockMutation(),
			swapCharacters: mockMutation(),
			swapSummons: mockMutation(),
			syncAllItems: mockMutation(),
			unlinkCollectionSource: mockMutation()
		},
		party: {
			create: mockMutation(),
			update: mockMutation(),
			delete: mockMutation(),
			remix: mockMutation(),
			favorite: mockMutation(),
			unfavorite: mockMutation(),
			shareWithCrew: mockMutation(),
			removeShare: mockMutation()
		},
		job: {
			updateJob: mockMutation(),
			updateJobSkills: mockMutation(),
			removeJobSkill: mockMutation(),
			updateAccessory: mockMutation(),
			removeAccessory: mockMutation()
		}
	} as unknown as PartyMutations
}

/** Creates a copy of MOCK_PARTY for test isolation */
export function createTestParty(overrides: Partial<Party> = {}): Party {
	return { ...MOCK_PARTY, ...overrides }
}
