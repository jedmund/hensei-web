<script lang="ts">
	/**
	 * Small circular count badge for the unit components. Renders the number of
	 * substitutes configured for the slot, anchored to the bottom-right of the
	 * containing frame via absolute positioning. Renders nothing when there are
	 * no substitutes.
	 */
	interface Props {
		count: number
	}

	let { count }: Props = $props()
</script>

{#if count > 0}
	<div class="substitute-count-badge" title="{count} substitute{count === 1 ? '' : 's'}">
		{count}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	.substitute-count-badge {
		position: absolute;
		bottom: spacing.$unit-half;
		right: spacing.$unit-half;
		min-width: 20px;
		height: 20px;
		padding: 0 spacing.$unit-half;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: typography.$font-tiny;
		font-weight: 600;
		line-height: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		z-index: effects.$z-tooltip;
		pointer-events: none;
		backdrop-filter: blur(4px);
	}
</style>
