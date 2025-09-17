<svelte:options runes={true} />

<script lang="ts">
	import type { IRow } from 'wx-svelte-grid'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'

	interface Props {
		row: IRow
	}

	const { row }: Props = $props()

	const element = $derived(row.element)
</script>

<div class="element-cell">
	<ElementLabel {element} size="small" />
</div>

<style lang="scss">
	.element-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
	}
</style>
