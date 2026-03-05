import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	addCharactersToCollectionOptions,
	addCharacterToCollectionOptions,
	updateCollectionCharacterOptions,
	removeCharacterFromCollectionOptions,
	bulkRemoveCharactersFromCollectionOptions,
	addWeaponToCollectionOptions,
	addWeaponsToCollectionOptions,
	updateCollectionWeaponOptions,
	removeWeaponFromCollectionOptions,
	bulkRemoveWeaponsFromCollectionOptions,
	addSummonToCollectionOptions,
	addSummonsToCollectionOptions,
	updateCollectionSummonOptions,
	removeSummonFromCollectionOptions,
	bulkRemoveSummonsFromCollectionOptions,
	addJobAccessoryToCollectionOptions,
	removeJobAccessoryFromCollectionOptions
} from '../collection.mutations'
import { createTestQueryClient } from './helpers'
import { collectionKeys } from '$lib/api/queries/collection.queries'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/collection.adapter', () => ({
	collectionAdapter: {
		addCharacters: vi.fn(),
		addCharacter: vi.fn(),
		updateCharacter: vi.fn(),
		removeCharacter: vi.fn(),
		removeCharactersBatch: vi.fn(),
		addWeapon: vi.fn(),
		addWeapons: vi.fn(),
		updateWeapon: vi.fn(),
		removeWeapon: vi.fn(),
		removeWeaponsBatch: vi.fn(),
		addSummon: vi.fn(),
		addSummons: vi.fn(),
		updateSummon: vi.fn(),
		removeSummon: vi.fn(),
		removeSummonsBatch: vi.fn(),
		addJobAccessory: vi.fn(),
		removeJobAccessory: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
})

// ============================================================================
// Character Mutations
// ============================================================================

describe('addCharactersToCollectionOptions', () => {
	it('invalidates characters and characterIds on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addCharactersToCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.characters())
		expect(keys).toContainEqual(collectionKeys.characterIds())
	})
})

describe('addCharacterToCollectionOptions', () => {
	it('invalidates characters and characterIds on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addCharacterToCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.characters())
		expect(keys).toContainEqual(collectionKeys.characterIds())
	})
})

describe('updateCollectionCharacterOptions', () => {
	const MOCK_COLLECTION_CHAR = { id: 'cc-1', uncapLevel: 4, name: 'Test' }

	it('optimistically merges updates into cached character', async () => {
		queryClient.setQueryData(collectionKeys.character('cc-1'), MOCK_COLLECTION_CHAR)
		const opts = updateCollectionCharacterOptions(queryClient)

		await opts.onMutate({ id: 'cc-1', input: { uncapLevel: 5 } as any })

		const cached = queryClient.getQueryData(collectionKeys.character('cc-1')) as any
		expect(cached.uncapLevel).toBe(5)
		expect(cached.name).toBe('Test')
	})

	it('returns snapshot for rollback', async () => {
		queryClient.setQueryData(collectionKeys.character('cc-1'), MOCK_COLLECTION_CHAR)
		const opts = updateCollectionCharacterOptions(queryClient)

		const context = await opts.onMutate({ id: 'cc-1', input: { uncapLevel: 5 } as any })

		expect(context.previousCharacter).toEqual(MOCK_COLLECTION_CHAR)
	})

	it('rolls back on error', async () => {
		queryClient.setQueryData(collectionKeys.character('cc-1'), MOCK_COLLECTION_CHAR)
		const opts = updateCollectionCharacterOptions(queryClient)
		const params = { id: 'cc-1', input: { uncapLevel: 5 } as any }

		const context = await opts.onMutate(params)
		opts.onError(new Error('fail'), params, context)

		const cached = queryClient.getQueryData(collectionKeys.character('cc-1')) as any
		expect(cached.uncapLevel).toBe(4)
	})

	it('does nothing on error without context', () => {
		queryClient.setQueryData(collectionKeys.character('cc-1'), MOCK_COLLECTION_CHAR)
		const opts = updateCollectionCharacterOptions(queryClient)

		opts.onError(new Error('fail'), { id: 'cc-1', input: {} as any }, undefined)

		const cached = queryClient.getQueryData(collectionKeys.character('cc-1'))
		expect(cached).toEqual(MOCK_COLLECTION_CHAR)
	})

	it('invalidates character and characters on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateCollectionCharacterOptions(queryClient)

		opts.onSettled(undefined, undefined, { id: 'cc-1', input: {} as any })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.character('cc-1'))
		expect(keys).toContainEqual(collectionKeys.characters())
	})
})

describe('removeCharacterFromCollectionOptions', () => {
	it('invalidates characters and characterIds on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removeCharacterFromCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.characters())
		expect(keys).toContainEqual(collectionKeys.characterIds())
	})
})

describe('bulkRemoveCharactersFromCollectionOptions', () => {
	it('invalidates characters and characterIds on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = bulkRemoveCharactersFromCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.characters())
		expect(keys).toContainEqual(collectionKeys.characterIds())
	})
})

// ============================================================================
// Weapon Mutations
// ============================================================================

describe('addWeaponToCollectionOptions', () => {
	it('invalidates weapons on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addWeaponToCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.weapons())
	})
})

describe('addWeaponsToCollectionOptions', () => {
	it('invalidates weapons on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addWeaponsToCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.weapons())
	})
})

describe('updateCollectionWeaponOptions', () => {
	it('resets weapons queries on success', () => {
		const spy = vi.spyOn(queryClient, 'resetQueries')
		const opts = updateCollectionWeaponOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.weapons())
	})
})

describe('removeWeaponFromCollectionOptions', () => {
	it('resets weapons queries on success', () => {
		const spy = vi.spyOn(queryClient, 'resetQueries')
		const opts = removeWeaponFromCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.weapons())
	})
})

describe('bulkRemoveWeaponsFromCollectionOptions', () => {
	it('resets weapons queries on success', () => {
		const spy = vi.spyOn(queryClient, 'resetQueries')
		const opts = bulkRemoveWeaponsFromCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.weapons())
	})
})

// ============================================================================
// Summon Mutations
// ============================================================================

describe('addSummonToCollectionOptions', () => {
	it('invalidates summons on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addSummonToCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.summons())
	})
})

describe('addSummonsToCollectionOptions', () => {
	it('invalidates summons on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addSummonsToCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.summons())
	})
})

describe('updateCollectionSummonOptions', () => {
	it('invalidates summons on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateCollectionSummonOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.summons())
	})
})

describe('removeSummonFromCollectionOptions', () => {
	it('invalidates summons on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removeSummonFromCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.summons())
	})
})

describe('bulkRemoveSummonsFromCollectionOptions', () => {
	it('invalidates summons on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = bulkRemoveSummonsFromCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.summons())
	})
})

// ============================================================================
// Job Accessory Mutations
// ============================================================================

describe('addJobAccessoryToCollectionOptions', () => {
	it('invalidates all collection queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = addJobAccessoryToCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.all)
	})
})

describe('removeJobAccessoryFromCollectionOptions', () => {
	it('invalidates all collection queries on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = removeJobAccessoryFromCollectionOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(collectionKeys.all)
	})
})
