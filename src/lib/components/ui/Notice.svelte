<script lang="ts">
	import type { Snippet } from 'svelte'
	import Button from './Button.svelte'
	import Tooltip from './Tooltip.svelte'
	import * as m from '$lib/paraglide/messages'

	type Variant =
		'gray' | 'blue' | 'yellow' | 'red' | 'wind' | 'fire' | 'water' | 'earth' | 'light' | 'dark'

	interface Props {
		variant?: Variant
		icon?: Snippet
		/** Short label shown in a pill before the text, e.g. "New". */
		badge?: string
		children: Snippet
		/** Trailing control, placed to the left of the dismiss button. */
		action?: Snippet
		/** Shows a dismiss (X) button when set. */
		onDismiss?: () => void
		class?: string
	}

	let {
		variant = 'gray',
		icon,
		badge,
		children,
		action,
		onDismiss,
		class: className = ''
	}: Props = $props()

	const elementVariants = ['wind', 'fire', 'water', 'earth', 'light', 'dark']
	const isElement = $derived(elementVariants.includes(variant))
</script>

<div class="notice {variant} {className}" class:element={isElement} role="status">
	{#if icon}
		<span class="notice-icon">
			{@render icon()}
		</span>
	{/if}
	{#if badge}
		<span class="notice-badge"><span>{badge}</span></span>
	{/if}
	<div class="notice-text">
		{@render children()}
	</div>
	{#if action || onDismiss}
		<div class="notice-actions">
			{@render action?.()}
			{#if onDismiss}
				<Tooltip content={m.notice_dismiss()}>
					<Button
						variant="ghost"
						size="small"
						icon="close"
						iconOnly
						onclick={onDismiss}
						aria-label={m.notice_dismiss()}
					/>
				</Tooltip>
			{/if}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.notice {
		--ghost-text: currentColor;
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit-2x;
		border-radius: $card-corner;
		font-size: $font-small;
	}

	.notice-text {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: $unit;
		font-size: $font-regular;
		line-height: 1.5;
		margin: 0;

		:global(p) {
			margin: 0;
		}
	}

	// Filled with the variant's text color, so it matches any notice.
	.notice-badge {
		flex-shrink: 0;
		padding: $unit-quarter $unit;
		border-radius: $item-corner;
		background: currentColor;
		font-size: $font-tiny;
		font-weight: $bold;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		line-height: 1.5;

		span {
			color: var(--card-bg);
		}
	}

	.notice-actions {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		gap: $unit-half;
	}

	.notice-icon {
		display: flex;
		flex-shrink: 0;
	}

	// Fixed color variants
	.gray {
		background: var(--notice-grey-bg);
		color: var(--notice-grey-text);
	}

	.blue {
		background: var(--notice-blue-bg);
		color: var(--notice-blue-text);
	}

	.yellow {
		background: var(--notice-yellow-bg);
		color: var(--notice-yellow-text);
	}

	.red {
		background: var(--notice-red-bg);
		color: var(--notice-red-text);
	}

	// Element variants
	.wind {
		background: var(--wind-bg);
		color: var(--wind-text);
	}

	.fire {
		background: var(--fire-bg);
		color: var(--fire-text);
	}

	.water {
		background: var(--water-bg);
		color: var(--water-text);
	}

	.earth {
		background: var(--earth-bg);
		color: var(--earth-text);
	}

	.light {
		background: var(--light-bg);
		color: var(--light-text);
	}

	.dark {
		background: var(--dark-bg);
		color: var(--dark-text);
	}
</style>
