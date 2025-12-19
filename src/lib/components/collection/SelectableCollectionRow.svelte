<script lang="ts">
	import { getContext } from 'svelte'
	import {
		SELECTION_MODE_KEY,
		type SelectionModeContext
	} from '$lib/stores/selectionMode.svelte'
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		id: string
		children: Snippet
		onClick?: () => void
	}

	let { id, children, onClick }: Props = $props()

	const selectionMode = getContext<SelectionModeContext | undefined>(SELECTION_MODE_KEY)

	const isSelected = $derived(selectionMode?.isSelected(id) ?? false)

	function handleCheckboxChange() {
		selectionMode?.toggle(id)
	}

	function handleCheckboxClick(e: MouseEvent) {
		e.stopPropagation()
	}

	function handleRowClick() {
		onClick?.()
	}
</script>

<div class="selectable-row" class:selected={isSelected} class:selection-active={selectionMode?.isActive}>
	{#if selectionMode?.isActive}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="checkbox-cell" onclick={handleCheckboxClick}>
			<Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} size="small" />
		</div>
	{/if}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="row-content" onclick={handleRowClick}>
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.selectable-row {
		display: flex;
		align-items: stretch;
		gap: $unit;
	}

	.checkbox-cell {
		display: flex;
		align-items: center;
		padding-left: $unit;
	}

	.row-content {
		flex: 1;
		min-width: 0;
	}

	.selectable-row.selected .row-content {
		outline: 2px solid var(--accent-color);
		outline-offset: 2px;
		border-radius: $card-corner;
	}

	.selectable-row.selection-active .row-content {
		cursor: pointer;
	}
</style>
