
<script lang="ts">
	import type { Snippet } from 'svelte'

	interface Props {
		children: Snippet
		noPadding?: boolean
	}

	let { children, noPadding = false }: Props = $props()
</script>

<div class="modal-body" class:no-padding={noPadding}>
	{@render children()}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.modal-body {
		padding: spacing.$unit-2x;
		padding-bottom: spacing.$unit-3x;
		overflow-y: auto;
		flex: 1;

		&.no-padding {
			padding: 0;
		}
	}
</style>
