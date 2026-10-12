<script lang="ts">
	/**
	 * Opens the unseal priority pane. Shown under the weapon and summon grids
	 * of a Solomonis build the viewer can edit.
	 */
	import Button from '$lib/components/ui/Button.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import * as m from '$lib/paraglide/messages'
	import UnsealPriorityPane from './UnsealPriorityPane.svelte'

	interface Props {
		canEdit: boolean
	}

	let { canEdit }: Props = $props()

	function open() {
		sidebar.openWithComponent(
			m.solomonis_web_grid_priority_title(),
			UnsealPriorityPane,
			{ canEdit },
			{ scrollable: true }
		)
	}
</script>

<div class="unseal-priority-button">
	<Button variant="secondary" size="small" leftIcon="lock" onclick={open}>
		{m.solomonis_web_grid_priority_title()}
	</Button>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.unseal-priority-button {
		display: flex;
		justify-content: center;
		margin-top: spacing.$unit-2x;
	}
</style>
