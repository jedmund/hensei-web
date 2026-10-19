<script lang="ts">
	/**
	 * The sticker following the pointer while it's dragged out of the
	 * picker, at the team page's size (the size it lands at). It leans with
	 * the drag and shrinks a little over the drop zone. Drawn from the team
	 * page's sticker stage, so it stays while the picker is closed.
	 */
	import StickerImage, { STICKER_EFFECTS } from './StickerImage.svelte'
	import { GHOST_SCALE, GHOST_SCALE_OVER_ZONE } from './stickerDrag.svelte'
	import { useStickerStage } from './stickerStage.svelte'
	import { STICKER_SIZE } from '$lib/utils/stickerLayout'

	const stage = useStickerStage()
</script>

{#if stage.drag.sticker}
	<div
		class="drag-ghost"
		style:left="{stage.drag.x}px"
		style:top="{stage.drag.y}px"
		style:--ghost-tilt="{stage.drag.tilt}deg"
		style:--ghost-scale={stage.drag.overZone ? GHOST_SCALE_OVER_ZONE : GHOST_SCALE}
		aria-hidden="true"
	>
		<StickerImage
			sticker={stage.drag.sticker}
			size={STICKER_SIZE}
			effects={STICKER_EFFECTS.ghost}
		/>
	</div>
{/if}

<style lang="scss">
	// The lean is already smoothed frame by frame, so only the scale eases
	.drag-ghost {
		position: fixed;
		z-index: 1000;
		pointer-events: none;
		transform: translate(-50%, -50%) rotate(var(--ghost-tilt, 0deg));
		scale: var(--ghost-scale, 1);
		transition: scale 0.12s ease;
	}
</style>
