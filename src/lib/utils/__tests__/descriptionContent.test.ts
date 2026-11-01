import { describe, it, expect } from 'vitest'
import * as m from '$lib/paraglide/messages'
import { descriptionToContent, textStyleLabel } from '../descriptionContent'

describe('descriptionToContent', () => {
	it('returns undefined for missing or empty descriptions', () => {
		expect(descriptionToContent(undefined)).toBeUndefined()
		expect(descriptionToContent(null)).toBeUndefined()
		expect(descriptionToContent('')).toBeUndefined()
	})

	it('parses a serialized Tiptap document', () => {
		const doc = {
			type: 'doc',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hi' }] }]
		}
		expect(descriptionToContent(JSON.stringify(doc))).toEqual(doc)
	})

	it('wraps legacy plain text in a paragraph', () => {
		expect(descriptionToContent('Plain {text')).toEqual({
			type: 'doc',
			content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Plain {text' }] }]
		})
	})

	it('passes a Tiptap document object through unchanged', () => {
		const doc = { type: 'doc', content: [] }
		expect(descriptionToContent(doc)).toBe(doc)
	})
})

describe('textStyleLabel', () => {
	const activeHeading =
		(level?: number) =>
		(name: string, attrs?: Record<string, unknown>): boolean =>
			level !== undefined && name === 'heading' && attrs?.level === level

	it('names the active heading level', () => {
		expect(textStyleLabel(activeHeading(1))).toBe(m.editor_heading_1())
		expect(textStyleLabel(activeHeading(2))).toBe(m.editor_heading_2())
		expect(textStyleLabel(activeHeading(3))).toBe(m.editor_heading_3())
	})

	it('falls back to paragraph', () => {
		expect(textStyleLabel(activeHeading())).toBe(m.editor_paragraph())
	})

	it('prefers the lowest level when several report active', () => {
		expect(textStyleLabel((name) => name === 'heading')).toBe(m.editor_heading_1())
	})
})
