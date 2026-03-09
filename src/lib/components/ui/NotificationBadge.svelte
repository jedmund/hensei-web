
<script lang="ts">
	import type { Element } from '$lib/types/api/shared'

	interface Props {
		/** Number of notifications */
		count?: number
		/** Whether to show the count number */
		showCount?: boolean
		/** Size variant */
		size?: 'small' | 'medium'
		/** Element for color styling */
		element?: Element
	}

	let { count = 0, showCount = false, size = 'small', element }: Props = $props()
</script>

{#if count > 0}
	<span
		class="notification-badge {element ?? ''}"
		class:medium={size === 'medium'}
		class:has-count={showCount}
	>
		{#if showCount}
			{count > 99 ? '99+' : count}
		{/if}
	</span>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;

	.notification-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--button-primary-bg);
		flex-shrink: 0;

		&.medium {
			min-width: 10px;
			height: 10px;
		}

		&.has-count {
			min-width: 16px;
			height: 16px;
			padding: 0 4px;
			border-radius: layout.$input-corner;
			font-size: 10px;
			font-weight: typography.$medium;
			color: white;

			&.medium {
				min-width: 18px;
				height: 18px;
				font-size: 11px;
			}
		}

		// Element-specific colors
		&.wind {
			background: var(--wind-button-bg);
		}
		&.fire {
			background: var(--fire-button-bg);
		}
		&.water {
			background: var(--water-button-bg);
		}
		&.earth {
			background: var(--earth-button-bg);
		}
		&.light {
			background: var(--light-button-bg);
			color: black;
		}
		&.dark {
			background: var(--dark-button-bg);
		}
	}
</style>
