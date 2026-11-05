import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'
import ConfirmationSlider from './ConfirmationSlider.svelte'

let component: ReturnType<typeof mount> | undefined

afterEach(() => {
	if (component) unmount(component)
	component = undefined
	document.body.innerHTML = ''
})

function setup(props: Record<string, unknown> = {}) {
	const onConfirm = vi.fn()
	component = mount(ConfirmationSlider, {
		target: document.body,
		props: { label: 'I understand', onConfirm, ...props }
	})
	const handle = document.querySelector<HTMLElement>('[role="slider"]')!
	const press = (key: string) => {
		handle.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
		flushSync()
	}
	return { onConfirm, handle, press }
}

describe('ConfirmationSlider', () => {
	it('shows its label', () => {
		setup()
		expect(document.querySelector('.label-text')?.textContent).toBe('I understand')
	})

	it('confirms once the arrow keys reach the end', () => {
		const { onConfirm, handle, press } = setup()
		press('ArrowRight')
		press('ArrowRight')
		expect(handle.getAttribute('aria-valuenow')).toBe('50')
		expect(onConfirm).not.toHaveBeenCalled()
		press('ArrowRight')
		press('ArrowRight')
		expect(onConfirm).toHaveBeenCalledTimes(1)
		expect(handle.getAttribute('aria-valuenow')).toBe('100')
	})

	it('confirms on Enter, only once', () => {
		const { onConfirm, press } = setup()
		press('Enter')
		press('Enter')
		press(' ')
		expect(onConfirm).toHaveBeenCalledTimes(1)
	})

	it('moves back with ArrowLeft and Home without confirming', () => {
		const { onConfirm, handle, press } = setup()
		press('ArrowRight')
		press('ArrowRight')
		press('ArrowLeft')
		expect(handle.getAttribute('aria-valuenow')).toBe('25')
		press('Home')
		expect(handle.getAttribute('aria-valuenow')).toBe('0')
		expect(onConfirm).not.toHaveBeenCalled()
	})

	it('springs back when onConfirm refuses, and can be tried again', () => {
		let allow = false
		const onConfirm = vi.fn(() => allow)
		const { handle, press } = setup({ onConfirm })
		press('Enter')
		expect(onConfirm).toHaveBeenCalledTimes(1)
		expect(handle.getAttribute('aria-valuenow')).toBe('0')
		allow = true
		press('Enter')
		expect(onConfirm).toHaveBeenCalledTimes(2)
		expect(handle.getAttribute('aria-valuenow')).toBe('100')
		press('Enter')
		expect(onConfirm).toHaveBeenCalledTimes(2)
	})

	it('steps through the progress labels as it moves', () => {
		const { press } = setup({ progressLabels: ['Keep going', 'Almost there', 'Thanks!'] })
		const text = () => document.querySelector('.label-text')?.textContent
		expect(text()).toBe('I understand')
		press('ArrowRight')
		expect(text()).toBe('Keep going')
		press('ArrowRight')
		expect(text()).toBe('Almost there')
		press('ArrowRight')
		expect(text()).toBe('Almost there')
		press('ArrowRight')
		expect(text()).toBe('Thanks!')
	})

	it('goes back to the resting label when a confirm is refused', () => {
		const { press } = setup({
			onConfirm: () => false,
			progressLabels: ['Keep going', 'Almost there', 'Thanks!']
		})
		press('ArrowRight')
		press('Enter')
		expect(document.querySelector('.label-text')?.textContent).toBe('I understand')
	})

	it('shows the refused label for 3 seconds after a refused confirm', () => {
		vi.useFakeTimers()
		try {
			const { press } = setup({ onConfirm: () => false, refusedLabel: 'Aww' })
			const text = () => document.querySelector('.label-text')?.textContent
			press('Enter')
			expect(text()).toBe('Aww')
			vi.advanceTimersByTime(2900)
			flushSync()
			expect(text()).toBe('Aww')
			vi.advanceTimersByTime(200)
			flushSync()
			expect(text()).toBe('I understand')
		} finally {
			vi.useRealTimers()
		}
	})

	it('drops the refused label when the user tries again', () => {
		const { press } = setup({ onConfirm: () => false, refusedLabel: 'Aww' })
		press('Enter')
		press('ArrowRight')
		press('Home')
		expect(document.querySelector('.label-text')?.textContent).toBe('I understand')
	})

	it('ignores keys when disabled', () => {
		const { onConfirm, press } = setup({ disabled: true })
		press('Enter')
		expect(onConfirm).not.toHaveBeenCalled()
	})

	it('starts at the end when already confirmed', () => {
		const { onConfirm, handle, press } = setup({ confirmed: true })
		expect(handle.getAttribute('aria-valuenow')).toBe('100')
		press('Enter')
		expect(onConfirm).not.toHaveBeenCalled()
	})
})
