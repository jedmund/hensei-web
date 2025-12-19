<!-- SegmentedControl Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import { setContext } from 'svelte'
	import type { Snippet } from 'svelte'
	import styles from './segmented-control.module.scss'
	import type { HTMLAttributes } from 'svelte/elements'

	export type SegmentedControlVariant = 'default' | 'blended' | 'background'
	export type SegmentedControlSize = 'default' | 'small'

	interface Props extends HTMLAttributes<HTMLDivElement> {
		value?: string
		onValueChange?: (value: string) => void
		variant?: SegmentedControlVariant
		size?: SegmentedControlSize
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | null
		grow?: boolean
		gap?: boolean
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
		class: className,
		wrapperClass,
		children
	}: Props = $props()

	// Provide variant, size, grow, and element to child segments via context
	setContext('segmented-control-variant', variant)
	setContext('segmented-control-size', size)
	setContext('segmented-control-grow', grow)
	setContext('segmented-control-element', element)

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

	const classList = $derived(
		[
			styles.segmentedControl,
			variantClasses[variant],
			grow ? styles.grow : '',
			gap ? styles.gap : '',
			className || ''
		]
			.filter(Boolean)
			.join(' ')
	)

	const wrapperClassList = $derived(
		[
			styles.wrapper,
			grow ? styles.growWrapper : '',
			wrapperClass || ''
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<div class={wrapperClassList}>
	<RadioGroupPrimitive.Root bind:value class={classList}>
		{@render children?.()}
	</RadioGroupPrimitive.Root>
</div>