<script lang="ts" module>
	import type { Party } from '$lib/types/api/party'

	/** What the sticker area needs of a team */
	export type StickerAreaParty = Pick<
		Party,
		'id' | 'shortcode' | 'element' | 'placedStickers' | 'mySticker'
	>
</script>

<script lang="ts">
	/**
	 * A band at the bottom of the description card where stickers sit
	 * anywhere, one per giver, so a sticker type can show more than once;
	 * stickers nobody placed line up from the left. Stickers are dropped here
	 * from the picker (or placed by clicking), and your own can be dragged to
	 * move it. They may hang up to half their size past the card's edges (the
	 * element marked [data-sticker-bounds]), but never above the area, so
	 * they can't cover the description.
	 *
	 * Placements (position and lean) come from the server with the team, and
	 * the viewer's own is saved when it's dropped or moved.
	 *
	 * Nothing shows until the area's size is known, so stickers don't start in
	 * the wrong place and jump; then they fade in and slap down one by one.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { DRAG_EXTRA_HEIGHT, STICKER_SIZE } from '$lib/utils/stickerLayout'
	import { getElementTypeKey } from '$lib/utils/element'
	import { getStickersFolded, saveStickersFolded } from '$lib/stores/stickersFolded.svelte'
	import { useStickerActions } from '$lib/composables/sticker-actions.svelte'
	import StickerImage, { STICKER_EFFECTS } from './StickerImage.svelte'
	import StickerRemoveButton from './StickerRemoveButton.svelte'
	import StickerAddMarker from './StickerAddMarker.svelte'
	import StickerDropZone from './StickerDropZone.svelte'
	import StickerDragGhost from './StickerDragGhost.svelte'
	import StickerFoldToggle from './StickerFoldToggle.svelte'
	import { OWN_KEY, StickerAreaState } from './stickerAreaState.svelte'
	import { PLACED_STICKER_ATTR, StickerAddCursor } from './stickerAddCursor.svelte'
	import { StickerEntrances, liftAway } from './stickerMotion'
	import { useStickerStage } from './stickerStage.svelte'
	import type { StickerPlacement } from '$lib/types/api/party'
	import type { StickerDrop } from './stickerDrag.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		/**
		 * The team: its id and shortcode for saving the viewer's placement,
		 * every sticker given (one per giver), the viewer's own (ahead of
		 * placedStickers while a give is in flight), and its element, which
		 * colors the drop zone and (+)
		 */
		party: StickerAreaParty
		/** The viewer can give this team a sticker: drop, click to place, move */
		canGive?: boolean
		size?: number
	}

	let { party, canGive = false, size = STICKER_SIZE }: Props = $props()

	const stickersQuery = createQuery(() => ({
		...stickerQueries.active(),
		enabled: (party.placedStickers?.length ?? 0) > 0 || canGive
	}))

	const stage = useStickerStage()
	const actions = stage.actions ?? useStickerActions({ getParty: () => party })

	const area = new StickerAreaState(() => ({
		placed: party.placedStickers,
		mySticker: party.mySticker,
		size,
		catalogue: stickersQuery.data
	}))
	const entrances = new StickerEntrances()

	// Measured whenever the width changes
	$effect(() => {
		void area.width
		area.measure()
	})

	$effect(() => {
		if (area.ready) entrances.settle()
	})

	// Dropped (or click-placed) from the picker: it becomes the viewer's
	// sticker right away; the picker gives it, and takes this back if that
	// fails
	function place(_slug: string, placement: StickerPlacement, drop: StickerDrop) {
		const before = area.ownPlacement
		area.ownPlacement = placement
		const cancelLanding = entrances.drop(OWN_KEY, drop)
		return () => {
			area.ownPlacement = before
			cancelLanding()
		}
	}

	$effect(() => {
		if (canGive) {
			return stage.registerDropZone({
				placementAt: (x, y) => area.placementAt(x, y),
				place
			})
		}
	})

	const expanded = $derived(canGive && stage.drag.sticker !== null)

	// A shade of the team's element; teams without one use the accent (see
	// .area's defaults)
	const element = $derived(getElementTypeKey(party.element))
	const elementColor = (shade: 'text' | 'bg' | 'button-bg') =>
		element ? `var(--${element}-${shade})` : undefined

	// Folded away with the toggle under the area, on every team the viewer
	// looks at. Dragging a sticker from the picker opens it on this team only,
	// to show where the sticker goes.
	let openedHere = $state(false)
	const foldSetting = getStickersFolded()
	const folded = $derived(!openedHere && foldSetting.value)

	function toggleFolded() {
		// Unfolding plays the entrance again: the stickers mount as a new batch
		if (folded) entrances.revealNextBatch()
		openedHere = false
		saveStickersFolded(foldSetting, !folded)
	}

	$effect(() => {
		if (expanded && folded) {
			entrances.revealNextBatch()
			openedHere = true
		}
	})

	// Empty and not dragging: no room at all, so teams without stickers look
	// as before until someone starts dragging one
	const height = $derived(
		expanded ? area.height + DRAG_EXTRA_HEIGHT : area.shown.length > 0 && !folded ? area.height : 0
	)

	const addCursor = new StickerAddCursor(
		area,
		stage,
		() => canGive && !party.mySticker && !expanded && !folded
	)

	// Taking your own sticker back
	function remove() {
		area.ownPlacement = null
		void actions.remove()
	}

	function pressOwn(event: PointerEvent, key: string, target: HTMLElement) {
		area.pressOwn(event, key, {
			// Clicked: open the picker by it, to swap it for another
			onClick: () => {
				if (canGive) stage.requestPicker(target, null)
			},
			save: (placement) =>
				party.mySticker ? actions.move(party.mySticker, placement) : Promise.resolve(true)
		})
	}
</script>

{#if area.shown.length > 0 || canGive}
	<!-- Clicking empty space is a mouse shortcut; the keyboard has Add sticker -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="area"
		class:collapsed={height === 0 && !folded}
		bind:this={area.element}
		bind:clientWidth={area.width}
		style:height="{height}px"
		style:--zone-accent={elementColor('text')}
		style:--zone-fill={elementColor('bg')}
		style:--zone-bright={elementColor('button-bg')}
		role="list"
		aria-label={m.sticker_labels_aria()}
		onpointermove={addCursor.hover}
		onpointerleave={addCursor.leave}
		onpointerdown={addCursor.press}
		onclick={addCursor.click}
	>
		{#if canGive}
			<StickerDropZone active={expanded} over={expanded && stage.drag.overZone} />
		{/if}

		{#if addCursor.at}
			<StickerAddMarker
				left={addCursor.at.left}
				top={addCursor.at.top}
				shown={addCursor.shown}
				pressed={addCursor.pressed}
			/>
		{/if}

		{#each area.ready && !folded ? area.shown : [] as entry, index (entry.key)}
			{@const pos = area.position(entry.key)}
			{@const own = entry.own}
			<span
				role="listitem"
				class="placed"
				class:own
				class:moving={area.moving === entry.key}
				{...{ [PLACED_STICKER_ATTR]: '' }}
				style:left="{pos.left}px"
				style:top="{pos.top}px"
				style:--placed-rotation={pos.rotation === null ? undefined : `${pos.rotation}deg`}
				onpointerdown={own ? (e) => pressOwn(e, entry.key, e.currentTarget) : undefined}
				use:entrances.track={{ key: entry.key, order: index, rotation: pos.rotation }}
				out:liftAway
			>
				<StickerImage
					sticker={entry.sticker}
					{size}
					effects={STICKER_EFFECTS.stage}
					rotation={pos.rotation}
				/>
				{#if own}
					<StickerRemoveButton onclick={remove} />
				{/if}
			</span>
		{/each}
	</div>
	{#if area.shown.length > 0}
		<StickerFoldToggle {folded} onclick={toggleFolded} />
	{/if}
{/if}

<!-- Following the pointer while a sticker is dragged out of the picker -->
{#if canGive}
	<StickerDragGhost />
{/if}

<style lang="scss">
	.area {
		// The team's element sets these (see the style props); teams without
		// one use the accent
		--zone-accent: var(--accent-blue);
		--zone-fill: color-mix(in srgb, var(--accent-blue) 14%, transparent);

		position: relative;
		// Overhanging stickers draw over the cards next to this one
		z-index: 2;
		transition: height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}
	}

	.placed {
		position: absolute;
		// Settling into a free spot, or making room for another sticker
		transition:
			left 0.2s ease,
			top 0.2s ease;

		&.moving {
			transition: none;
		}

		@media (prefers-reduced-motion: reduce) {
			transition: none;
		}

		display: block;
		line-height: 0;
		transform: rotate(var(--placed-rotation, 0deg));

		// Yours sits on top, so it and its remove button can always be reached
		&.own {
			z-index: 1;
			cursor: grab;
			touch-action: none;
		}

		&.moving {
			cursor: grabbing;
			z-index: 2;
		}
	}

	.area:has(:global(.add-marker.shown)) {
		cursor: pointer;
	}

	// The (x) on your own sticker, turned with it. Hidden until the pointer
	// is over the sticker area; touch screens have no hover, so it stays.
	.placed :global(.sticker-remove) {
		opacity: 0;

		.area:hover &,
		&:focus-visible {
			opacity: 1;
		}

		@media (hover: none) {
			opacity: 1;
		}
	}

	.placed.moving :global(.sticker-remove) {
		opacity: 0;
	}
</style>
