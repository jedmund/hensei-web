<script lang="ts">
	import { onMount } from 'svelte'

	type Props = {
		host: HTMLElement | undefined
		selector?: string
		trigger?: unknown
		class?: string
	}

	const { host, selector = '.selected', trigger, class: className = '' }: Props = $props()

	let x = $state<number | null>(null)
	let w = $state(0)
	let ready = $state(false)

	function measure() {
		if (!host) {
			x = null
			return
		}
		const selected = host.querySelector(selector) as HTMLElement | null
		if (!selected) {
			x = null
			return
		}
		x = selected.offsetLeft
		w = selected.offsetWidth
		if (!ready) {
			requestAnimationFrame(() => {
				ready = true
			})
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
		x === null ? 'opacity: 0;' : `transform: translateX(${x}px); width: ${w}px; opacity: 1;`
	)
</script>

<span class="sliding-selection {className}" class:ready aria-hidden="true" {style}></span>

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

		&.ready {
			transition:
				transform effects.$duration-standard ease,
				width effects.$duration-standard ease,
				opacity effects.$duration-quick ease;
		}
	}
</style>
