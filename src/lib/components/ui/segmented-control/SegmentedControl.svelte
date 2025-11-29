<!-- SegmentedControl Component -->
<svelte:options runes={true} />

<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'
	import { setContext } from 'svelte'
	import type { Snippet } from 'svelte'
	import styles from './segmented-control.module.scss'
	import type { HTMLAttributes } from 'svelte/elements'

	export type SegmentedControlVariant = 'default' | 'blended' | 'background'

	interface Props extends HTMLAttributes<HTMLDivElement> {
		value?: string
		onValueChange?: (value: string) => void
		variant?: SegmentedControlVariant
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
		element = null,
		grow = false,
		gap = false,
		class: className,
		wrapperClass,
		children,
		...restProps
	}: Props = $props()

	// Provide variant to child segments via context
	setContext('segmented-control-variant', variant)

	$effect(() => {
		if (onValueChange && value !== undefined) {
			onValueChange(value)
		}
	})

	const variantClasses = {
		default: '',
		blended: styles.blended,
		background: styles.background
	}

	const elementClasses = {
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
			element ? elementClasses[element] : '',
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
	<RadioGroupPrimitive.Root bind:value class={classList} {...restProps}>
		{@render children?.()}
	</RadioGroupPrimitive.Root>
</div>