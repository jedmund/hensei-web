<script lang="ts">
	/**
	 * The pickers at the top of a home card (events and raids, new items). On
	 * mobile they stick under the navigation like a list header until the card
	 * scrolls away, styled as the top of a card while stuck.
	 */
	import type { Snippet } from 'svelte'
	import { MediaQuery } from 'svelte/reactivity'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()

	const isMobile = new MediaQuery('(max-width: 768px)')

	let header = $state<HTMLElement>()
	let stuck = $state(false)
	$effect(() => {
		const el = header
		if (!el || !isMobile.current) {
			stuck = false
			return
		}
		let scroller = el.parentElement
		while (scroller && !/(auto|scroll|overlay)/.test(getComputedStyle(scroller).overflowY)) {
			scroller = scroller.parentElement
		}
		if (!scroller) return
		const container = scroller
		const update = () => {
			// Sticky top is 0 inside the container's padding, which clears the navigation
			const line =
				container.getBoundingClientRect().top + parseFloat(getComputedStyle(container).paddingTop)
			stuck = el.getBoundingClientRect().top <= line + 0.5
		}
		update()
		container.addEventListener('scroll', update, { passive: true })
		return () => container.removeEventListener('scroll', update)
	})
</script>

<div class="pinned" class:stuck bind:this={header}>
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.pinned {
		display: grid;
		gap: calc($unit * 1.5);

		&:empty {
			display: none;
		}

		// The scroll container's top padding already clears the navigation, so
		// it sticks at 0. It spans the card's padding so teams slide under it.
		@media (max-width: 768px) {
			position: sticky;
			top: 0;
			z-index: 2;
			margin: 0 calc($unit * -1.5);
			padding: $unit calc($unit * 1.5);
			background: var(--card-bg);

			// Stuck, it's the top of a card: rounded corners, and the page
			// background painted above it (and in the corners) so the teams
			// scrolling up behind it are hidden
			&.stuck {
				border-radius: $page-corner $page-corner 0 0;
				box-shadow: 0 (-$unit-12x) 0 $unit-12x var(--background);
			}
		}
	}
</style>
