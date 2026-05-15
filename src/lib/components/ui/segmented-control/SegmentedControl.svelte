<!-- SegmentedControl Component -->

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import type { Snippet } from 'svelte'
	import styles from './segmented-control.module.scss'
	import type { HTMLAttributes } from 'svelte/elements'
	import { setSegmentedControlContext } from './context'
	import SlidingSelection from '$lib/components/ui/SlidingSelection.svelte'

	export type SegmentedControlVariant = 'default' | 'blended' | 'background'
	export type SegmentedControlSize = 'default' | 'small' | 'xsmall'

	interface Props extends HTMLAttributes<HTMLDivElement> {
		value?: string
		onValueChange?: (value: string) => void
		variant?: SegmentedControlVariant
		size?: SegmentedControlSize
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | null
		grow?: boolean
		gap?: boolean
		/**
		 * Render an animated sliding pill behind the selected segment instead of
		 * per-segment background styling. The pill spring-animates between
		 * segments as the value changes.
		 */
		slidingIndicator?: boolean
		class?: string
		wrapperClass?: string
		children?: Snippet
	}

	let {
		value = $bindable(),
		onValueChange,
		variant = 'default',
		size = 'default',
		element = null,
		grow = false,
		gap = false,
		slidingIndicator = false,
		class: className,
		wrapperClass,
		children
	}: Props = $props()

	let rootEl = $state<HTMLElement>()

	// Provide variant, size, grow, element, and slidingIndicator to child segments via context
	// Use a getter for element so it stays reactive when the prop changes
	setSegmentedControlContext({
		get variant() {
			return variant
		},
		get size() {
			return size
		},
		get grow() {
			return grow
		},
		get element() {
			return element
		},
		get slidingIndicator() {
			return slidingIndicator
		}
	})

	// Track previous value to only fire callback on actual changes (not initialization)
	let previousValue = $state<string | undefined>(undefined)

	$effect(() => {
		if (onValueChange && value !== undefined) {
			// Only call onValueChange if value actually changed (not on initialization)
			if (previousValue !== undefined && value !== previousValue) {
				onValueChange(value)
			}
			previousValue = value
		}
	})

	const variantClasses = {
		default: '',
		blended: styles.blended,
		background: styles.background
	}

	const elementClasses: Record<string, string | undefined> = {
		wind: styles.wind,
		fire: styles.fire,
		water: styles.water,
		earth: styles.earth,
		dark: styles.dark,
		light: styles.light
	}

	const classList = $derived(
		[
			styles.segmentedControl,
			variantClasses[variant],
			grow ? styles.grow : '',
			gap ? styles.gap : '',
			slidingIndicator ? styles.slidingIndicator : '',
			slidingIndicator && element ? elementClasses[element] : '',
			className || ''
		]
			.filter(Boolean)
			.join(' ')
	)

	const wrapperClassList = $derived(
		[styles.wrapper, grow ? styles.growWrapper : '', wrapperClass || ''].filter(Boolean).join(' ')
	)
</script>

<div class={wrapperClassList}>
	<RadioGroupPrimitive.Root bind:value>
		{#snippet child({ props })}
			<div {...props} bind:this={rootEl} class={classList}>
				{#if slidingIndicator}
					<SlidingSelection
						host={rootEl}
						trigger={value}
						selector="[data-state='checked']"
						spring={{ stiffness: 0.18, damping: 0.7 }}
					/>
				{/if}
				{@render children?.()}
			</div>
		{/snippet}
	</RadioGroupPrimitive.Root>
</div>
