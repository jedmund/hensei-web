<script lang="ts" generics="T">
	/**
	 * Splits `items` into pages of `pageSize`, renders one page at a time with
	 * `page`, and slides between them in the direction moved. Indicator dots
	 * and ghost arrow buttons under the page move between pages; with a
	 * single page there are none. Pages are clipped only mid-slide, so
	 * shadows near the edges aren't cut off at rest.
	 */
	import type { Snippet } from 'svelte'
	import { cubicOut } from 'svelte/easing'
	import Button from './Button.svelte'
	import { prefersReducedMotion } from '$lib/utils/motion'

	interface Props {
		items: T[]
		pageSize: number
		/** The page shown, from 0 */
		index?: number
		page: Snippet<[T[]]>
		/** Accessible names for the controls */
		labels: {
			previous: string
			next: string
			page: (page: number, count: number) => string
		}
	}

	let { items, pageSize, index = $bindable(0), page, labels }: Props = $props()

	const count = $derived(Math.max(1, Math.ceil(items.length / pageSize)))
	const shown = $derived(items.slice(index * pageSize, (index + 1) * pageSize))

	// Which way the pages slide: 1 to the next page, -1 to the previous
	let direction = $state<1 | -1>(1)
	let sliding = $state(false)

	function goTo(next: number) {
		const target = Math.min(Math.max(next, 0), count - 1)
		if (target === index) return
		direction = target > index ? 1 : -1
		sliding = true
		index = target
	}

	// The page slides out one way as the next slides in from the other
	function slide(_node: Element, { from }: { from: 1 | -1 }) {
		return {
			duration: prefersReducedMotion() ? 0 : 240,
			easing: cubicOut,
			css: (t: number) => `transform: translateX(${(1 - t) * from * 100}%)`
		}
	}
</script>

<!-- Pages stack in one cell while one slides out and the next slides in -->
<div class="pages" class:sliding>
	{#key index}
		<div
			in:slide={{ from: direction }}
			out:slide={{ from: direction === 1 ? -1 : 1 }}
			onintroend={() => (sliding = false)}
		>
			{@render page(shown)}
		</div>
	{/key}
</div>

{#if count > 1}
	<div class="pager">
		<Button
			variant="ghost"
			size="small"
			iconOnly
			icon="chevron-left"
			aria-label={labels.previous}
			disabled={index === 0}
			onclick={() => goTo(index - 1)}
		/>
		<div class="dots">
			{#each { length: count }, dot (dot)}
				<button
					type="button"
					class="dot"
					class:active={dot === index}
					aria-label={labels.page(dot + 1, count)}
					aria-current={dot === index ? 'page' : undefined}
					onclick={() => goTo(dot)}
				></button>
			{/each}
		</div>
		<Button
			variant="ghost"
			size="small"
			iconOnly
			icon="chevron-right"
			aria-label={labels.next}
			disabled={index === count - 1}
			onclick={() => goTo(index + 1)}
		/>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.pages {
		display: grid;

		&.sliding {
			overflow: hidden;
		}

		> * {
			grid-area: 1 / 1;
		}
	}

	.pager {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit spacing.$unit-half spacing.$unit-half;
	}

	.dots {
		display: flex;
		gap: spacing.$unit-half;
	}

	// Small dots with a larger target around them
	.dot {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
		padding: 0;
		border: none;
		background: none;
		cursor: pointer;

		&::before {
			content: '';
			width: 6px;
			height: 6px;
			border-radius: 50%;
			background: var(--text-tertiary);
			opacity: 0.5;
			transition:
				opacity 0.15s ease,
				background-color 0.15s ease;
		}

		&:hover::before {
			opacity: 1;
		}

		&.active::before {
			background: var(--text-primary);
			opacity: 1;
		}

		@media (prefers-reduced-motion: reduce) {
			&::before {
				transition: none;
			}
		}
	}
</style>
