<svelte:options runes={true} />

<script lang="ts">
	import { Tooltip as TooltipBase } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		/** The suggested value to display */
		suggestion: string | number | boolean | null | undefined
		/** Label for the suggestion (e.g., field name) */
		label?: string
		/** Whether the suggestion has been dismissed */
		dismissed?: boolean
		/** Callback when user accepts the suggestion */
		onAccept?: () => void
		/** Callback when user dismisses the suggestion */
		onDismiss?: () => void
	}

	let { suggestion, label, dismissed = false, onAccept, onDismiss }: Props = $props()

	// Format the suggestion for display
	const displayValue = $derived(() => {
		if (suggestion === null || suggestion === undefined) return 'None'
		if (typeof suggestion === 'boolean') return suggestion ? 'Yes' : 'No'
		return String(suggestion)
	})

	let isOpen = $state(false)
</script>

{#if suggestion !== undefined && suggestion !== null && !dismissed}
	<TooltipBase.Root bind:open={isOpen} delayDuration={0}>
		<TooltipBase.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					class="suggestion-badge"
					aria-label="Wiki suggestion available"
				>
					<Icon name="sparkles" size={14} />
				</button>
			{/snippet}
		</TooltipBase.Trigger>
		<TooltipBase.Content class="suggestion-tooltip" sideOffset={4}>
			<div class="suggestion-content">
				{#if label}
					<span class="suggestion-label">{label}:</span>
				{/if}
				<span class="suggestion-value">{displayValue()}</span>
			</div>
			<div class="suggestion-actions">
				{#if onAccept}
					<button
						type="button"
						class="action accept"
						onclick={() => {
							onAccept?.()
							isOpen = false
						}}
						title="Accept suggestion"
					>
						<Icon name="check" size={14} />
					</button>
				{/if}
				{#if onDismiss}
					<button
						type="button"
						class="action dismiss"
						onclick={() => {
							onDismiss?.()
							isOpen = false
						}}
						title="Dismiss suggestion"
					>
						<Icon name="x" size={14} />
					</button>
				{/if}
			</div>
		</TooltipBase.Content>
	</TooltipBase.Root>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;

	.suggestion-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: calc($unit * 2.5);
		height: calc($unit * 2.5);
		border-radius: 50%;
		background: linear-gradient(135deg, $wind-text-20 0%, $water-text-20 100%);
		border: none;
		cursor: pointer;
		padding: 0;
		margin-left: $unit-half;
		flex-shrink: 0;
		transition: transform 0.15s ease, box-shadow 0.15s ease;

		&:hover {
			transform: scale(1.1);
			box-shadow: 0 0 8px rgba($wind-text-20, 0.5);
		}

		:global(svg) {
			color: white;
		}
	}

	:global(.suggestion-tooltip) {
		background: var(--tooltip-bg, #2a2a2a);
		color: var(--tooltip-text, white);
		padding: $unit;
		border-radius: $item-corner;
		font-size: $font-small;
		z-index: 1000;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
		gap: $unit;
		min-width: 120px;
	}

	.suggestion-content {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
	}

	.suggestion-label {
		font-size: calc($font-small * 0.9);
		color: var(--text-secondary);
		font-weight: $normal;
	}

	.suggestion-value {
		font-weight: $medium;
		color: white;
		word-break: break-word;
	}

	.suggestion-actions {
		display: flex;
		gap: $unit-half;
		justify-content: flex-end;
		padding-top: $unit-half;
		border-top: 1px solid rgba(white, 0.1);
	}

	.action {
		display: flex;
		align-items: center;
		justify-content: center;
		width: calc($unit * 3.5);
		height: calc($unit * 3.5);
		border-radius: $item-corner-small;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s ease;

		&.accept {
			background: $wind-text-20;
			color: white;

			&:hover {
				background: $wind-text-10;
			}
		}

		&.dismiss {
			background: $grey-60;
			color: white;

			&:hover {
				background: $grey-50;
			}
		}
	}
</style>
