
<script lang="ts">
	import { RadioGroup as RadioGroupPrimitive } from 'bits-ui'

	export type ElementType = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface NavItem {
		value: string
		label: string
	}

	interface Props {
		value?: string
		onValueChange?: (value: string) => void
		element?: ElementType
		items: NavItem[]
	}

	let { value = $bindable(), onValueChange, element = 'water', items }: Props = $props()

	// Track previous value to only fire callback on actual changes
	let previousValue = $state<string | undefined>(undefined)

	$effect(() => {
		if (onValueChange && value !== undefined) {
			if (previousValue !== undefined && value !== previousValue) {
				onValueChange(value)
			}
			previousValue = value
		}
	})
</script>

<nav class="settings-nav element-{element}">
	<RadioGroupPrimitive.Root bind:value class="nav-list">
		{#each items as item}
			<RadioGroupPrimitive.Item value={item.value} class="nav-item">
				{item.label}
			</RadioGroupPrimitive.Item>
		{/each}
	</RadioGroupPrimitive.Root>
</nav>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.settings-nav {
		display: flex;
		flex-direction: column;
		width: 160px;
		flex-shrink: 0;
	}

	:global(.nav-list) {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	:global(.nav-item) {
		display: flex;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		border: none;
		border-radius: layout.$item-corner;
		background: transparent;
		color: var(--text-secondary);
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		cursor: pointer;
		text-align: left;
		@include effects.smooth-transition(effects.$duration-quick, background-color, color);

		&:hover:not([data-state='checked']) {
			background: var(--button-contained-bg-hover);
			color: var(--text-primary);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 2px;
		}
	}

	// Element-specific styles for checked state
	.element-wind {
		:global(.nav-item[data-state='checked']) {
			background: var(--wind-nav-selected-bg);
			color: var(--wind-nav-selected-text);
		}
	}

	.element-fire {
		:global(.nav-item[data-state='checked']) {
			background: var(--fire-nav-selected-bg);
			color: var(--fire-nav-selected-text);
		}
	}

	.element-water {
		:global(.nav-item[data-state='checked']) {
			background: var(--water-nav-selected-bg);
			color: var(--water-nav-selected-text);
		}
	}

	.element-earth {
		:global(.nav-item[data-state='checked']) {
			background: var(--earth-nav-selected-bg);
			color: var(--earth-nav-selected-text);
		}
	}

	.element-dark {
		:global(.nav-item[data-state='checked']) {
			background: var(--dark-nav-selected-bg);
			color: var(--dark-nav-selected-text);
		}
	}

	.element-light {
		:global(.nav-item[data-state='checked']) {
			background: var(--light-nav-selected-bg);
			color: var(--light-nav-selected-text);
		}
	}
</style>
