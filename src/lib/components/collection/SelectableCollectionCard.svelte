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

	function handleCardClick() {
		onClick?.()
	}
</script>

<div class="selectable-card" class:selected={isSelected} class:selection-active={selectionMode?.isActive}>
	{#if selectionMode?.isActive}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="checkbox-overlay" onclick={handleCheckboxClick}>
			<Checkbox checked={isSelected} onCheckedChange={handleCheckboxChange} size="small" />
		</div>
	{/if}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="card-content" onclick={handleCardClick}>
		{@render children()}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.selectable-card {
		position: relative;
	}

	.checkbox-overlay {
		position: absolute;
		top: $unit-half;
		left: $unit-half;
		z-index: 10;
		background: rgba(0, 0, 0, 0.5);
		border-radius: $item-corner;
		padding: $unit-fourth;
	}

	.card-content {
		width: 100%;
	}

	.selectable-card.selected .card-content {
		outline: 2px solid var(--accent-color);
		outline-offset: 2px;
		border-radius: $card-corner;
	}

	.selectable-card.selection-active .card-content {
		cursor: pointer;
	}
</style>
