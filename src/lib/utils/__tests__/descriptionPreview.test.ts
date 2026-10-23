import { describe, it, expect } from 'vitest'
import { descriptionPreview } from '../descriptionPreview'

const doc = (...content: unknown[]) => JSON.stringify({ type: 'doc', content })
const paragraph = (text?: string) =>
	text ? { type: 'paragraph', content: [{ type: 'text', text }] } : { type: 'paragraph' }

describe('descriptionPreview', () => {
	it('is empty without a description', () => {
		expect(descriptionPreview(undefined)).toEqual({ text: '', hasMore: false })
		expect(descriptionPreview('')).toEqual({ text: '', hasMore: false })
	})

	it('takes the first non-empty paragraph or heading', () => {
		expect(
			descriptionPreview(
				doc(paragraph(), { type: 'heading', content: [{ type: 'text', text: ' Title ' }] })
			)
		).toEqual({ text: 'Title', hasMore: false })
	})

	it('names mentions, falling back to their English game name', () => {
		const mention = (id: unknown) => ({ type: 'mention', attrs: { id } })
		const preview = descriptionPreview(
			doc({
				type: 'paragraph',
				content: [
					{ type: 'text', text: 'Bring ' },
					mention({ name: { en: 'Lucilius', ja: 'ルシウス' } }),
					{ type: 'text', text: ' and ' },
					mention({ granblue_en: 'Fallback' })
				]
			})
		)
		expect(preview.text).toBe('Bring Lucilius and Fallback')
	})

	it('has more when text or any other block follows', () => {
		expect(descriptionPreview(doc(paragraph('a'), paragraph('b'))).hasMore).toBe(true)
		expect(descriptionPreview(doc(paragraph('a'), { type: 'bulletList' })).hasMore).toBe(true)
		expect(descriptionPreview(doc(paragraph('a'), paragraph())).hasMore).toBe(false)
	})

	it('is empty for a document without text, or JSON that is not a document', () => {
		expect(descriptionPreview(doc(paragraph()))).toEqual({ text: '', hasMore: false })
		expect(descriptionPreview(JSON.stringify({ type: 'paragraph' }))).toEqual({
			text: '',
			hasMore: false
		})
	})

	it('reads legacy plain text by line', () => {
		expect(descriptionPreview('  First\n\nSecond')).toEqual({ text: 'First', hasMore: true })
		expect(descriptionPreview('Only')).toEqual({ text: 'Only', hasMore: false })
	})
})
