import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushSync } from 'svelte'
import type { GridSummon, GridWeapon, Party } from '$lib/types/api/party'
import type { PartyContext } from '$lib/types/party-context'
import { useUnitSeal, type UnitSeal } from './useUnitSeal.svelte'

const mocks = vi.hoisted(() => ({ writeSealState: vi.fn() }))

vi.mock('$lib/components/solomonis/grid/sealActions', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/components/solomonis/grid/sealActions')>()
	return { ...actual, writeSealState: mocks.writeSealState }
})

const solomonisParty = { id: 'p1', solomonis: { blessings: [] } } as unknown as Party
const plainParty = { id: 'p1' } as unknown as Party

const cleanups: (() => void)[] = []

function create(
	initial: {
		type?: 'weapon' | 'summon'
		party?: Party
		canEdit?: boolean
		position?: number
		item?: GridWeapon | GridSummon
	} = {}
) {
	const props = $state({
		party: initial.party ?? solomonisParty,
		canEdit: initial.canEdit ?? true,
		position: initial.position ?? 3,
		item: initial.item
	})
	const ctx = {
		getParty: () => props.party,
		canEdit: () => props.canEdit
	} as unknown as PartyContext
	let seal!: UnitSeal
	cleanups.push(
		$effect.root(() => {
			seal = useUnitSeal({
				type: initial.type ?? 'weapon',
				ctx,
				item: () => props.item,
				position: () => props.position
			})
		})
	)
	flushSync()
	return { seal, props }
}

function weapon(sealState: string | null): GridWeapon {
	return { id: 'w1', sealState } as unknown as GridWeapon
}

beforeEach(() => {
	mocks.writeSealState.mockReset()
})

afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup()
})

describe('useUnitSeal', () => {
	it('has no seal outside a Solomonis party', () => {
		const { seal } = create({ party: plainParty, item: weapon('sealed') })
		expect(seal.seal).toBeNull()
		expect(seal.canToggle).toBe(false)
	})

	it('has no seal on the support summon', () => {
		const { seal } = create({ type: 'summon', position: 6 })
		expect(seal.seal).toBeNull()
	})

	it('keeps the seal on weapon position 6', () => {
		const { seal } = create({ type: 'weapon', position: 6 })
		expect(seal.seal).not.toBeNull()
	})

	it('lets editors toggle a filled, non-starting slot', () => {
		const { seal, props } = create({ item: weapon('sealed') })
		expect(seal.seal?.state).toBe('sealed')
		expect(seal.canToggle).toBe(true)

		props.canEdit = false
		expect(seal.canToggle).toBe(false)
	})

	it("doesn't toggle starting or empty slots", () => {
		expect(create({ position: 0, item: weapon(null) }).seal.canToggle).toBe(false)
		expect(create({ position: 3 }).seal.canToggle).toBe(false)
	})

	it('writes the next seal state', () => {
		const item = weapon('sealed')
		const { seal } = create({ item })
		seal.toggle()
		expect(mocks.writeSealState).toHaveBeenCalledWith(expect.anything(), 'weapon', item, 'unsealed')
	})

	it("doesn't write without an item", () => {
		create().seal.toggle()
		expect(mocks.writeSealState).not.toHaveBeenCalled()
	})
})
