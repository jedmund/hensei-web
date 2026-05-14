<script lang="ts">
	/**
	 * Circular bookmark badge overlaid on the top-left of a unit's image to
	 * signal that the user owns this item in their collection.
	 */
	import Icon from '$lib/components/Icon.svelte'
</script>

<div class="bookmark-overlay" aria-hidden="true">
	<Icon name="bookmark" width={12} height={16} />
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/effects' as effects;

	.bookmark-overlay {
		position: absolute;
		top: spacing.$unit;
		left: spacing.$unit;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: spacing.$unit;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.8);
		color: white;
		z-index: effects.$z-sticky;
		pointer-events: none;
	}
</style>
