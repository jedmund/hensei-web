import { describe, it, expect, afterEach } from 'vitest'
import { mount, unmount } from 'svelte'
import AuraScaling from './AuraScaling.svelte'

let component: ReturnType<typeof mount> | undefined

afterEach(() => {
	if (component) unmount(component)
	component = undefined
	document.body.innerHTML = ''
})

function lines(scaling: Parameters<typeof AuraScaling>[1]['scaling']) {
	component = mount(AuraScaling, { target: document.body, props: { scaling } })
	return [...document.querySelectorAll('.aura-scaling')].map((line) => line.textContent?.trim())
}

describe('AuraScaling', () => {
	it("lists each effect at the team's group count", () => {
		expect(
			lines({
				weaponGroups: 4,
				effects: [
					{ target: 'normal_atk', value: 160 },
					{ target: 'def', value: 40 }
				],
				bonusAt: null,
				bonusActive: false
			})
		).toEqual(['4 weapon groups: 160% Normal ATK and 40% DEF'])
	})

	it('adds the bonus line once the bonus is active', () => {
		expect(
			lines({
				weaponGroups: 6,
				effects: [{ target: 'normal_atk', value: 200 }],
				bonusAt: 5,
				bonusActive: true
			})
		).toEqual(['6 weapon groups: 200% Normal ATK', '5+ group bonus active'])
	})

	it('shows the count alone without an amount', () => {
		expect(
			lines({
				weaponGroups: 3,
				effects: [{ target: 'normal_atk', value: null }],
				bonusAt: null,
				bonusActive: false
			})
		).toEqual(['3 weapon groups'])
	})
})
