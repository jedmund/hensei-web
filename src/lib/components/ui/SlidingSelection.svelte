<script lang="ts">
	import { onMount } from 'svelte'
	import { Spring } from 'svelte/motion'

	type SpringConfig = { stiffness?: number; damping?: number; precision?: number }

	type Props = {
		host: HTMLElement | undefined
		selector?: string
		trigger?: unknown
		class?: string
		spring?: SpringConfig
	}

	const {
		host,
		selector = '.selected',
		trigger,
		class: className = '',
		spring: springConfig
	}: Props = $props()

	const springOpts = { stiffness: 0.18, damping: 0.5, ...springConfig }
	const x = new Spring(0, springOpts)
	const w = new Spring(0, springOpts)

	let visible = $state(false)
	let initialized = $state(false)

	function measure() {
		if (!host) {
			visible = false
			return
		}
		const selected = host.querySelector(selector) as HTMLElement | null
		if (!selected) {
			visible = false
			return
		}
		const nextX = selected.offsetLeft
		const nextW = selected.offsetWidth
		if (!initialized) {
			x.set(nextX, { instant: true })
			w.set(nextW, { instant: true })
			initialized = true
			requestAnimationFrame(() => {
				visible = true
			})
		} else {
			x.set(nextX)
			w.set(nextW)
			visible = true
		}
	}

	$effect(() => {
		void trigger
		void host
		measure()
	})

	onMount(() => {
		if (!host) return
		const observer = new ResizeObserver(() => measure())
		observer.observe(host)
		return () => observer.disconnect()
	})

	const style = $derived(
		visible
			? `transform: translateX(${x.current}px); width: ${w.current}px; opacity: 1;`
			: 'opacity: 0;'
	)
</script>

<span class="sliding-selection {className}" aria-hidden="true" {style}></span>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;

	.sliding-selection {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		width: 0;
		border-radius: var(--sliding-selection-radius, #{layout.$full-corner});
		background-color: var(
			--sliding-selection-bg,
			var(--menu-bg-item-selected, var(--menu-bg-item-hover))
		);
		pointer-events: none;
		z-index: 0;
		opacity: 0;
		transform: translateX(0);
		will-change: transform, width;
		// Spring drives transform + width; opacity stays on a brief CSS fade
		// so the indicator can appear/disappear without measurement flicker.
		transition: opacity effects.$duration-quick ease;
	}
</style>
