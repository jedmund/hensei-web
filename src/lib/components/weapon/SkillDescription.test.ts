import { describe, it, expect } from 'vitest'
import { render } from 'svelte/server'
import SkillDescription from './SkillDescription.svelte'
import SkillDescriptionTestHarness from './SkillDescriptionTestHarness.svelte'

// Text content of the server render, without Svelte's hydration comments.
function text(html: string): string {
	return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<[^>]+>/g, '')
}

describe('SkillDescription', () => {
	it('renders segments with no whitespace between them', () => {
		const { body } = render(SkillDescriptionTestHarness, {
			props: {
				segments: [
					{ text: 'Take ' },
					{ text: '5% damage', tooltip: 'Based on max HP.' },
					{ text: ' every turn\n' },
					{ text: 'When main weapon:', strong: true }
				]
			}
		})
		expect(text(body)).toBe('Take 5% damage every turnWhen main weapon:')
		expect(body).toContain('class="has-tooltip')
		expect(body).toContain('<strong>When main weapon:</strong>')
	})

	it('puts each line in its own paragraph', () => {
		const { body } = render(SkillDescriptionTestHarness, {
			props: { segments: [{ text: 'Gain DA Up.\nGain TA Up.' }, { text: '\nHeal 10%.' }] }
		})
		const paragraphs = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(([, inner]) =>
			text(inner ?? '')
		)
		expect(paragraphs).toEqual(['Gain DA Up.', 'Gain TA Up.', 'Heal 10%.'])
	})

	it('falls back to the raw wiki text without segments', () => {
		const { body } = render(SkillDescription, { props: { raw: "'''Bold''' {{tt|text|tip}}" } })
		expect(body).toContain('<strong>Bold</strong> text')
	})
})
