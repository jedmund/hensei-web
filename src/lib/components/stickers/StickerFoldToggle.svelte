<script lang="ts">
	/** The full-width chevron under the sticker area that folds it away */
	import Button from '$lib/components/ui/Button.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		folded: boolean
		onclick: () => void
	}

	let { folded, onclick }: Props = $props()
</script>

<div class="fold">
	<Button
		variant="ghost"
		size="small"
		fullWidth
		icon={folded ? 'chevron-down' : 'chevron-up'}
		aria-expanded={!folded}
		aria-label={folded ? m.sticker_area_show() : m.sticker_area_hide()}
		{onclick}
	/>
</div>

<style lang="scss">
	.fold {
		margin-top: 4px;
		// Over any sticker hanging past the area (which is z-index 2), so it
		// can always be clicked
		position: relative;
		z-index: 3;
	}
</style>
