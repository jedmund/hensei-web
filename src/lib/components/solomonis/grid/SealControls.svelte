<script lang="ts">
	/**
	 * Controls under the weapon and summon grids of a Solomonis party: an
	 * "Unsealed state" toggle that hides the seal overlays (the game's button
	 * of the same name), then for editors a button that opens the unseal
	 * priority pane.
	 */
	import Button from '$lib/components/ui/Button.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import * as m from '$lib/paraglide/messages'
	import UnsealPriorityPane from './UnsealPriorityPane.svelte'
	import { sealOverlays } from './sealOverlays.svelte'

	interface Props {
		canEdit: boolean
	}

	let { canEdit }: Props = $props()

	function openPriority() {
		sidebar.openWithComponent(
			m.solomonis_web_grid_priority_title(),
			UnsealPriorityPane,
			{ canEdit },
			{ scrollable: true }
		)
	}

	function toggleOverlays() {
		sealOverlays.hidden = !sealOverlays.hidden
	}
</script>

<div class="seal-controls">
	<Button
		variant="secondary"
		size="small"
		leftIcon="refresh"
		active={sealOverlays.hidden}
		aria-pressed={sealOverlays.hidden}
		onclick={toggleOverlays}
	>
		{m.solomonis_web_grid_unsealed_state()}
	</Button>
	{#if canEdit}
		<Button variant="secondary" size="small" leftIcon="lock" onclick={openPriority}>
			{m.solomonis_web_grid_priority_title()}
		</Button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.seal-controls {
		display: flex;
		justify-content: center;
		gap: spacing.$unit;
		margin-top: spacing.$unit-2x;
	}
</style>
