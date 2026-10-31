/**
 * Tests for the helpers shared by the weapon, character and summon adapters
 */

import { describe, it, expect } from 'vitest'
import { batchPreviewBody } from '../entity.shared'

describe('batchPreviewBody', () => {
	it('omits wiki_data when none is given', () => {
		expect(batchPreviewBody(['Page'])).toEqual({ wiki_pages: ['Page'] })
		expect(batchPreviewBody(['Page'])).not.toHaveProperty('wiki_data')
	})

	it('includes wiki_data when given', () => {
		expect(batchPreviewBody(['Page'], { Page: 'text' })).toEqual({
			wiki_pages: ['Page'],
			wiki_data: { Page: 'text' }
		})
	})
})
