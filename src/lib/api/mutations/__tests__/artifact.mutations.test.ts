import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
	createCollectionArtifactOptions,
	createCollectionArtifactsBatchOptions,
	updateCollectionArtifactOptions,
	deleteCollectionArtifactOptions,
	bulkDeleteCollectionArtifactsOptions,
	createGridArtifactOptions,
	updateGridArtifactOptions,
	deleteGridArtifactOptions,
	equipCollectionArtifactOptions,
	gradeArtifactOptions,
	syncGridArtifactOptions
} from '../artifact.mutations'
import { createTestQueryClient } from './helpers'
import type { QueryClient } from '@tanstack/svelte-query'

vi.mock('$lib/api/adapters/artifact.adapter', () => ({
	artifactAdapter: {
		createCollectionArtifact: vi.fn(),
		createCollectionArtifactsBatch: vi.fn(),
		updateCollectionArtifact: vi.fn(),
		deleteCollectionArtifact: vi.fn(),
		deleteCollectionArtifactsBatch: vi.fn(),
		createGridArtifact: vi.fn(),
		updateGridArtifact: vi.fn(),
		deleteGridArtifact: vi.fn(),
		equipCollectionArtifact: vi.fn(),
		gradeArtifact: vi.fn(),
		syncGridArtifact: vi.fn()
	}
}))

let queryClient: QueryClient

beforeEach(() => {
	queryClient = createTestQueryClient()
})

// ============================================================================
// Collection Artifact Mutations
// ============================================================================

describe('createCollectionArtifactOptions', () => {
	it('invalidates collection base on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createCollectionArtifactOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['collection', 'artifacts'])
	})
})

describe('createCollectionArtifactsBatchOptions', () => {
	it('invalidates collection base on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createCollectionArtifactsBatchOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['collection', 'artifacts'])
	})
})

describe('updateCollectionArtifactOptions', () => {
	it('invalidates collection base on settled', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateCollectionArtifactOptions(queryClient)

		opts.onSettled()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['collection', 'artifacts'])
	})
})

describe('deleteCollectionArtifactOptions', () => {
	it('invalidates collection base on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deleteCollectionArtifactOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['collection', 'artifacts'])
	})
})

describe('bulkDeleteCollectionArtifactsOptions', () => {
	it('invalidates collection base on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = bulkDeleteCollectionArtifactsOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['collection', 'artifacts'])
	})
})

// ============================================================================
// Grid Artifact Mutations
// ============================================================================

describe('createGridArtifactOptions', () => {
	it('invalidates specific party on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = createGridArtifactOptions(queryClient)

		opts.onSuccess(undefined, { partyId: 'party-1', gridCharacterId: 'gc-1', artifactId: 'a-1' } as any)

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['parties', 'party-1'])
	})
})

describe('updateGridArtifactOptions', () => {
	it('invalidates all parties on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = updateGridArtifactOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['parties'])
	})
})

describe('deleteGridArtifactOptions', () => {
	it('invalidates all parties on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = deleteGridArtifactOptions(queryClient)

		opts.onSuccess()

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['parties'])
	})
})

describe('equipCollectionArtifactOptions', () => {
	it('invalidates specific party on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = equipCollectionArtifactOptions(queryClient)

		opts.onSuccess(undefined, { partyId: 'party-1', gridCharacterId: 'gc-1', collectionArtifactId: 'ca-1' })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['parties', 'party-1'])
	})
})

// ============================================================================
// Grading & Sync
// ============================================================================

describe('gradeArtifactOptions', () => {
	it('has no cache side effects', () => {
		const opts = gradeArtifactOptions()

		expect(opts.mutationFn).toBeDefined()
		expect((opts as any).onSuccess).toBeUndefined()
		expect((opts as any).onSettled).toBeUndefined()
		expect((opts as any).onMutate).toBeUndefined()
	})
})

describe('syncGridArtifactOptions', () => {
	it('invalidates party detail by shortcode on success', () => {
		const spy = vi.spyOn(queryClient, 'invalidateQueries')
		const opts = syncGridArtifactOptions(queryClient)

		opts.onSuccess(undefined, { id: 'ga-1', partyShortcode: 'ABC123' })

		const keys = spy.mock.calls.map((c) => c[0].queryKey)
		expect(keys).toContainEqual(['parties', 'detail', 'ABC123'])
	})
})
