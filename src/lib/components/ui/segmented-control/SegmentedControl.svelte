<!-- SegmentedControl Component -->
<svelte:options runes={true} />
<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui';
	import styles from './segmented-control.module.scss';
	import type { HTMLDivAttributes } from 'svelte/elements';

	interface Props extends HTMLDivAttributes {
		value?: string;
		onValueChange?: (value: string) => void;
		variant?: 'default' | 'blended' | 'background';
		element?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | null;
		grow?: boolean;
		gap?: boolean;
		class?: string;
		wrapperClass?: string;
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
	}: Props = $props();

	$effect(() => {
		if (onValueChange && value !== undefined) {
			onValueChange(value);
		}
	});

	const variantClasses = {
		default: '',
		blended: styles.blended,
		background: styles.background
	};

	const elementClasses = {
		wind: styles.wind,
		fire: styles.fire,
		water: styles.water,
		earth: styles.earth,
		dark: styles.dark,
		light: styles.light
	};
</script>

<div class={`${styles.wrapper} ${wrapperClass || ''}`}>
	<RadioGroupPrimitive.Root
		bind:value
		class={`${styles.segmentedControl} ${variantClasses[variant]} ${element ? elementClasses[element] : ''} ${grow ? styles.grow : ''} ${gap ? styles.gap : ''} ${className || ''}`}
		{...restProps}
	>
		{@render children?.()}
	</RadioGroupPrimitive.Root>
</div>