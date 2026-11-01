import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushSync } from 'svelte'
import type { GridCharacter, GridSummon, Party } from '$lib/types/api/party'
import type { PartyContext } from '$lib/types/party-context'
import { GridType } from '$lib/types/enums'
import { useUnitActions, type UnitActions, type UnitType } from './useUnitActions.svelte'

const mocks = vi.hoisted(() => ({ openDetailsSidebar: vi.fn() }))

vi.mock('$lib/features/details/openDetailsSidebar.svelte', () => ({
	openDetailsSidebar: mocks.openDetailsSidebar
}))
vi.mock('$app/navigation', () => ({ goto: vi.fn() }))

const party = { id: 'p1', shortcode: 'abc123' } as unknown as Party

const cleanups: (() => void)[] = []

function create(
	initial: {
		type?: UnitType
		item?: GridCharacter | GridSummon
		canEdit?: boolean
		details?: Parameters<typeof useUnitActions>[0]['details']
	} = {}
) {
	const props = $state({
		item: initial.item,
		position: 2,
		canEdit: initial.canEdit ?? true,
		selectedSlot: null as number | null,
		activeTab: GridType.Character
	})
	const ctx = {
		getParty: () => party,
		canEdit: () => props.canEdit,
		getEditKey: () => null,
		getSelectedSlot: () => props.selectedSlot,
		getActiveTab: () => props.activeTab,
		services: { gridService: {} }
	} as unknown as PartyContext
	let actions!: UnitActions
	cleanups.push(
		$effect.root(() => {
			actions = useUnitActions({
				type: initial.type ?? 'character',
				ctx,
				item: () => props.item,
				position: () => props.position,
				entity: () => undefined,
				details: initial.details
			})
		})
	)
	flushSync()
	return { actions, props }
}

beforeEach(() => {
	mocks.openDetailsSidebar.mockReset()
})

afterEach(() => {
	for (const cleanup of cleanups.splice(0)) cleanup()
})

describe('useUnitActions', () => {
	describe('isSelected', () => {
		it('follows the selected slot on its own grid tab', () => {
			const { actions, props } = create()
			expect(actions.isSelected).toBe(false)

			props.selectedSlot = 2
			expect(actions.isSelected).toBe(true)

			props.activeTab = GridType.Weapon
			expect(actions.isSelected).toBe(false)
		})

		it('matches the summon tab for summons', () => {
			const { actions, props } = create({ type: 'summon' })
			props.selectedSlot = 2
			props.activeTab = GridType.Summon
			expect(actions.isSelected).toBe(true)
		})
	})

	it('reports the party ids for the sidebars', () => {
		const { actions } = create()
		expect(actions.partyRefs()).toEqual({ partyId: 'p1', partyShortcode: 'abc123' })
	})

	describe('viewDetails', () => {
		const item = { id: 'c1' } as GridCharacter

		it('does nothing on an empty slot', () => {
			create().actions.viewDetails()
			expect(mocks.openDetailsSidebar).not.toHaveBeenCalled()
		})

		it('opens the sidebar with owner actions and the save callback', () => {
			const onSaveCharacter = vi.fn()
			const { actions } = create({ item, details: { onSaveCharacter } })
			actions.viewDetails()
			expect(mocks.openDetailsSidebar).toHaveBeenCalledWith({
				type: 'character',
				item,
				onSaveCharacter,
				isOwner: true,
				onReplace: actions.replace,
				onRemove: actions.remove,
				partyId: 'p1',
				partyShortcode: 'abc123'
			})
		})

		it('leaves out owner actions for viewers', () => {
			const { actions } = create({ type: 'summon', item, canEdit: false })
			actions.viewDetails()
			expect(mocks.openDetailsSidebar).toHaveBeenCalledWith({
				type: 'summon',
				item,
				isOwner: false,
				onReplace: undefined,
				onRemove: undefined,
				partyId: 'p1',
				partyShortcode: 'abc123'
			})
		})
	})
})
