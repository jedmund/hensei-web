import { describe, it, expect, afterEach } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import EntityImagesTab from './EntityImagesTab.svelte'

let component: ReturnType<typeof mount> | undefined

afterEach(() => {
	if (component) unmount(component)
	component = undefined
	document.body.innerHTML = ''
})

describe('EntityImagesTab', () => {
	// A raid without enemy/summon/quest ids gets the same placeholder URL for
	// every size, so the images can't be keyed by URL.
	it('renders images that share a URL', () => {
		const url = '/placeholders/placeholder-weapon-grid.png'
		const images = ['icon', 'thumbnail', 'lobby', 'background'].map((variant) => ({
			url,
			label: variant,
			variant
		}))

		component = mount(EntityImagesTab, { target: document.body, props: { images } })
		flushSync()

		expect(document.querySelectorAll('.image-item')).toHaveLength(4)
	})
})
