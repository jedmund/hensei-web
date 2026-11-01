<script lang="ts">
	/**
	 * Warning badge on a unit whose collection item is gone ("not in
	 * collection"). Each unit places it inside its frame: characters and
	 * summons as a direct child, weapons inside their modifier layer.
	 */
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'
</script>

<div class="orphaned-badge" title={m.tooltip_not_in_collection()}>
	<Icon name="alertTriangle" size={16} />
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/effects' as effects;

	.orphaned-badge {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 24px;
		height: 24px;
		background: colors.$error;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		z-index: effects.$z-sticky;
		pointer-events: auto;
		cursor: help;
		box-shadow: var(--shadow-sm);
	}
</style>
