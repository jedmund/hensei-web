<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()
</script>

<div class="modal-body">
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.modal-body {
		padding: spacing.$unit-2x;
		padding-bottom: spacing.$unit-3x;
		overflow-y: auto;
		flex: 1;
	}
</style>
