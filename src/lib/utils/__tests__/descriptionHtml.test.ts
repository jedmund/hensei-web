import { describe, it, expect } from 'vitest'
import { parseDescription } from '../descriptionHtml'

function doc(...content: unknown[]) {
	return JSON.stringify({ type: 'doc', content })
}

function heading(level: unknown, text = 'Title') {
	return { type: 'heading', attrs: { level }, content: [{ type: 'text', text }] }
}

describe('parseDescription', () => {
	it('renders valid heading levels', () => {
		expect(parseDescription(doc(heading(2))).html).toBe('<h2>Title</h2>')
		expect(parseDescription(doc(heading(6))).html).toBe('<h6>Title</h6>')
	})

	it('falls back to h1 for heading levels outside 1–6 or not numbers', () => {
		for (const level of ['1 onmouseover=alert(1)', '2', 0, 7, null, undefined, { x: 1 }]) {
			expect(parseDescription(doc(heading(level))).html).toBe('<h1>Title</h1>')
		}
	})

	it('never emits attributes from a heading level', () => {
		const html = parseDescription(doc(heading('1 onmouseover=alert(1) x'))).html
		expect(html).not.toContain('onmouseover')
	})

	it('escapes text content', () => {
		const html = parseDescription(
			doc({ type: 'paragraph', content: [{ type: 'text', text: '<img src=x onerror=alert(1)>' }] })
		).html
		expect(html).toBe('<p>&lt;img src=x onerror=alert(1)&gt;</p>')
	})

	it('neutralizes unsafe link hrefs', () => {
		const html = parseDescription(
			doc({
				type: 'paragraph',
				content: [
					{
						type: 'text',
						text: 'click',
						marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }]
					}
				]
			})
		).html
		expect(html).toContain('href="#"')
		expect(html).not.toContain('javascript:')
	})

	it('escapes plain-text descriptions', () => {
		expect(parseDescription('a <b>\nline').html).toBe('<p>a &lt;b&gt;<br />line</p>')
	})

	it('returns empty output for missing content', () => {
		expect(parseDescription(undefined)).toEqual({ html: '', entities: new Map() })
	})
})
