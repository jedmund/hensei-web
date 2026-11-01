import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount } from 'svelte'
import CrewSectionHeader from './CrewSectionHeader.svelte'

let component: ReturnType<typeof mount> | undefined

afterEach(() => {
	if (component) unmount(component)
	component = undefined
	document.body.innerHTML = ''
})

describe('CrewSectionHeader', () => {
	it('separates the title and count with a space', () => {
		component = mount(CrewSectionHeader, {
			target: document.body,
			props: { title: 'Members', count: 5 }
		})
		expect(document.querySelector('.section-title')?.textContent).toBe('Members 5')
	})

	it('shows the title alone without a count', () => {
		component = mount(CrewSectionHeader, {
			target: document.body,
			props: { title: 'Expired' }
		})
		expect(document.querySelector('.section-title')?.textContent).toBe('Expired')
		expect(document.querySelector('.count')).toBeNull()
	})
})
