<svelte:options runes={true} />

<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
	}

	let { children }: Props = $props()
</script>

<div class="modal-footer">
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.modal-footer {
		padding: spacing.$unit-2x;
		padding-top: 0;
		display: flex;
		gap: spacing.$unit-2x;
		justify-content: flex-end;
	}
</style>
