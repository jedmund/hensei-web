<svelte:options runes={true} />

<script lang="ts">
	interface Props {
		/** Number of notifications */
		count?: number
		/** Whether to show the count number */
		showCount?: boolean
		/** Size variant */
		size?: 'small' | 'medium'
	}

	let { count = 0, showCount = false, size = 'small' }: Props = $props()
</script>

{#if count > 0}
	<span class="notification-badge" class:medium={size === 'medium'} class:has-count={showCount}>
		{#if showCount}
			{count > 99 ? '99+' : count}
		{/if}
	</span>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/colors' as colors;

	.notification-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 8px;
		height: 8px;
		border-radius: 50%;
		background: colors.$fire-text-20;
		flex-shrink: 0;

		&.medium {
			min-width: 10px;
			height: 10px;
		}

		&.has-count {
			min-width: 16px;
			height: 16px;
			padding: 0 4px;
			border-radius: 8px;
			font-size: 10px;
			font-weight: typography.$medium;
			color: white;

			&.medium {
				min-width: 18px;
				height: 18px;
				font-size: 11px;
			}
		}
	}
</style>
