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
		/**
		 * Full-width content under the message, e.g. a control. Kept outside the
		 * status region so screen readers don't announce it as part of the text.
		 */
		footer?: Snippet
		class?: string
	}

	let {
		variant = 'gray',
		icon,
		badge,
		children,
		action,
		onDismiss,
		footer,
		class: className = ''
	}: Props = $props()

	const elementVariants = ['wind', 'fire', 'water', 'earth', 'light', 'dark']
	const isElement = $derived(elementVariants.includes(variant))
</script>

{#snippet message()}
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
			{#if action}
				<div class="notice-action">{@render action()}</div>
			{/if}
			{#if onDismiss}
				<div class="notice-dismiss">
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
				</div>
			{/if}
		</div>
	{/if}
{/snippet}

{#if footer}
	<div class="notice with-footer {variant} {className}" class:element={isElement}>
		<div class="notice-message" role="status">
			{@render message()}
		</div>
		<div class="notice-footer">
			{@render footer()}
		</div>
	</div>
{:else}
	<div class="notice {variant} {className}" class:element={isElement} role="status">
		{@render message()}
	</div>
{/if}

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

	.with-footer {
		flex-direction: column;
		align-items: stretch;
		gap: $unit-2x;
	}

	.notice-message {
		display: flex;
		align-items: center;
		gap: $unit;
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

	.notice-action,
	.notice-dismiss {
		display: flex;
	}

	.notice-icon {
		display: flex;
		flex-shrink: 0;
	}

	// Phones: the badge goes above the text and the action below it, and the dismiss button stays at the end of the
	// first row. A grid with margins rather than gaps, so a missing icon
	// leaves no space.
	@media (max-width: 768px) {
		.notice {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr) auto;
			column-gap: 0;
			row-gap: $unit;
		}

		// The icon and dismiss button sit by the first line of text
		.notice-icon {
			grid-column: 1;
			grid-row: 1;
			align-self: start;
			margin-right: $unit;
		}

		.notice-text {
			grid-column: 2;
			grid-row: 1;
		}

		.notice-actions {
			display: contents;
		}

		// The action runs the full width as an outlined button in the notice's
		// own color (Button has no stroke variant, and the button comes from
		// the caller's snippet, so it's styled here)
		.notice-action {
			grid-column: 2 / -1;
			grid-row: 2;

			:global([data-button-root]) {
				width: 100%;
				min-height: 44px;
				justify-content: center;
				background: transparent;
				color: currentColor;
				border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
			}

			@media (hover: hover) {
				:global([data-button-root]:hover:not(:disabled)) {
					background: color-mix(in srgb, currentColor 10%, transparent);
					color: currentColor;
				}
			}
		}

		.notice-dismiss {
			grid-column: 3;
			grid-row: 1;
			align-self: start;
			margin-left: $unit;
			// Centers the 30px button on the first 24px line of text
			margin-top: -3px;
		}

		// With a badge, it takes the first row (beside the dismiss button) and
		// everything else moves down one
		.notice:has(.notice-badge) {
			.notice-badge {
				grid-column: 2;
				grid-row: 1;
				justify-self: start;
				align-self: center;
			}

			.notice-icon {
				grid-row: 2;
			}

			// Nothing beside it now, so the text runs the full width
			.notice-text {
				grid-row: 2;
				grid-column: 2 / -1;
			}

			.notice-action {
				grid-row: 3;
			}

			.notice-dismiss {
				align-self: center;
				margin-top: 0;
			}
		}
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
