/**
 * Tests for usePartyDragDrop composable — validation rules
 *
 * These are behavioral tests for the party's drag-drop business rules:
 * - Protected slots: mainhand weapon, main/friend summon cannot be drop targets
 * - Type safety: weapons can't be dropped onto character/summon slots
 * - Character exception: characters can be dropped into main-characters container
 *
 * These rules protect game-specific grid semantics. If violated, items end up
 * in wrong grid positions causing visual bugs and API errors.
 *
 * Operation dispatch tests (swap/move) require DOM for startDrag/endDrag
 * flow and would need browser-environment tests (.svelte.test.ts).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePartyDragDrop } from '../party-drag-drop.svelte'
import { createMockMutations, createTestParty } from './helpers'
import type { PartyMutations } from '../party-mutations.svelte'
import type { Party } from '$lib/types/api/party'

vi.mock('svelte-sonner', () => ({
	toast: { error: vi.fn(), success: vi.fn() }
}))

vi.mock('$lib/utils/errors', () => ({
	extractErrorMessage: vi.fn((_err: unknown, fallback: string) => fallback)
}))

describe('usePartyDragDrop — validation', () => {
	let mutations: PartyMutations
	let party: Party

	beforeEach(() => {
		mutations = createMockMutations()
		party = createTestParty()
		vi.clearAllMocks()
	})

	function getValidator() {
		const { dragContext } = usePartyDragDrop({
			mutations,
			getParty: () => party,
			canEdit: () => true
		})
		return dragContext.validateDrop
	}

	// Note: validateDrop has a built-in self-drop check and type-mismatch check
	// before calling the custom onValidate. Our tests cover both layers.

	it('rejects cross-type drops (weapon → character)', () => {
		const validate = getValidator()
		const source = { type: 'weapon' as const, container: 'weapons', position: 1 }
		const target = { type: 'character' as const, container: 'characters', position: 1 }

		expect(validate(source, target)).toBe(false)
	})

	it('rejects self-drops', () => {
		const validate = getValidator()
		const source = { type: 'weapon' as const, container: 'weapons', position: 1 }
		const target = { type: 'weapon' as const, container: 'weapons', position: 1 }

		expect(validate(source, target)).toBe(false)
	})

	it('allows weapon-to-weapon drops at regular positions', () => {
		const validate = getValidator()
		const source = { type: 'weapon' as const, container: 'weapons', position: 1 }
		const target = { type: 'weapon' as const, container: 'weapons', position: 2 }

		expect(validate(source, target)).toBe(true)
	})

	it('blocks weapon drops onto mainhand position (-1)', () => {
		const validate = getValidator()
		const source = { type: 'weapon' as const, container: 'weapons', position: 1 }
		const target = { type: 'weapon' as const, container: 'weapons', position: -1 }

		expect(validate(source, target)).toBe(false)
	})

	it('blocks summon drops onto main summon position (-1)', () => {
		const validate = getValidator()
		const source = { type: 'summon' as const, container: 'summons', position: 1 }
		const target = { type: 'summon' as const, container: 'summons', position: -1 }

		expect(validate(source, target)).toBe(false)
	})

	it('blocks summon drops onto friend summon position (6)', () => {
		const validate = getValidator()
		const source = { type: 'summon' as const, container: 'summons', position: 1 }
		const target = { type: 'summon' as const, container: 'summons', position: 6 }

		expect(validate(source, target)).toBe(false)
	})

	it('allows summon-to-summon drops at regular positions', () => {
		const validate = getValidator()
		const source = { type: 'summon' as const, container: 'summons', position: 1 }
		const target = { type: 'summon' as const, container: 'summons', position: 3 }

		expect(validate(source, target)).toBe(true)
	})

	it('allows character drops in main-characters container', () => {
		const validate = getValidator()
		const source = { type: 'character' as const, container: 'characters', position: 1 }
		const target = { type: 'character' as const, container: 'main-characters', position: 2 }

		expect(validate(source, target)).toBe(true)
	})

	it('allows character-to-character drops at regular positions', () => {
		const validate = getValidator()
		const source = { type: 'character' as const, container: 'characters', position: 1 }
		const target = { type: 'character' as const, container: 'characters', position: 3 }

		expect(validate(source, target)).toBe(true)
	})
})
