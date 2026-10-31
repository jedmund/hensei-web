/**
 * Tests for the response mappers shared by the weapon, character and
 * summon adapters
 */

import { describe, it, expect } from 'vitest'
import { batchPreviewBody, toDownloadStatus, toValidationResult } from '../entity.shared'

describe('toValidationResult', () => {
	it('maps the validate response to camelCase fields', () => {
		expect(
			toValidationResult({
				valid: true,
				granblue_id: '1040001',
				exists_in_db: false,
				image_urls: { main: 'main.jpg' }
			})
		).toEqual({
			valid: true,
			granblueId: '1040001',
			existsInDb: false,
			error: undefined,
			imageUrls: { main: 'main.jpg' }
		})
	})
})

describe('toDownloadStatus', () => {
	it('maps the shared download status fields', () => {
		expect(
			toDownloadStatus({
				status: 'processing',
				progress: 50,
				images_downloaded: 2,
				images_total: 4,
				granblue_id: '1040001',
				images: { main: ['a.jpg'] },
				updated_at: '2026-01-01'
			})
		).toEqual({
			status: 'processing',
			progress: 50,
			imagesDownloaded: 2,
			imagesTotal: 4,
			error: undefined,
			granblueId: '1040001',
			images: { main: ['a.jpg'] },
			updatedAt: '2026-01-01'
		})
	})
})

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
