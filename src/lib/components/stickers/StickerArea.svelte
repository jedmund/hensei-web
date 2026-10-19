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
	 * A band at the bottom of the description card where
	 * stickers sit anywhere, one per giver, so a sticker type can show more
	 * than once; stickers nobody placed line up from the left. Stickers are
	 * dropped here from the picker, and your own can be dragged to move it.
	 * They may hang up to half their size past the card's edges (the element
	 * marked [data-sticker-bounds]), but never above the area, so they can't
	 * cover the description.
	 *
	 * Placements (position and lean) come from the server with the team, and
	 * the viewer's own is saved when it's dropped or moved.
	 *
	 * Nothing shows until the area's size is known, so stickers don't start in
	 * the wrong place and jump; then they fade in and slap down one by one.
	 */
	import { tick } from 'svelte'
	import { createQuery } from '@tanstack/svelte-query'
	import { stickerQueries } from '$lib/api/queries/sticker.queries'
	import { findSticker } from '$lib/utils/stickers'
	import {
		DRAG_EXTRA_HEIGHT,
		ROW_TOP,
		STICKER_SIZE,
		areaHeight,
		clampPoint,
		freeSpot as findFreeSpot,
		fromFraction,
		layoutStickers,
		stickerBounds,
		toFraction,
		withinBounds,
		type Point
	} from '$lib/utils/stickerLayout'
	import StickerImage, { STICKER_EFFECTS } from './StickerImage.svelte'
	import { getStickersFolded, saveStickersFolded } from '$lib/stores/stickersFolded.svelte'
	import { useStickerStage, type PickerAnchor } from './stickerStage.svelte'
	import { landSticker, liftAway, revealSticker } from './stickerMotion'
	import { trackDrag, type StickerDrop } from './stickerDrag.svelte'
	import { useStickerActions } from '$lib/composables/sticker-actions.svelte'
	import StickerRemoveButton from './StickerRemoveButton.svelte'
	import StickerAddMarker, { ADD_MARKER_SIZE } from './StickerAddMarker.svelte'
	import StickerFoldToggle from './StickerFoldToggle.svelte'
	import type { StickerPlacement } from '$lib/types/api/party'
	import { getElementTypeKey } from '$lib/utils/element'
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

	const placed = $derived(party.placedStickers)
	const mySticker = $derived(party.mySticker)
	const element = $derived(getElementTypeKey(party.element))

	let area = $state<HTMLDivElement>()
	let width = $state(0)

	// How many stickers there are, before the catalogue has loaded
	const count = $derived((placed ?? []).filter((given) => !given.mine).length + (mySticker ? 1 : 0))

	const HEIGHT = $derived(areaHeight(width, count, size))
	const EXPANDED_HEIGHT = $derived(HEIGHT + DRAG_EXTRA_HEIGHT)

	const stickersQuery = createQuery(() => ({
		...stickerQueries.active(),
		enabled: (placed?.length ?? 0) > 0 || canGive
	}))

	const stage = useStickerStage()
	const actions = stage.actions ?? useStickerActions({ getParty: () => party })

	// How far the card's edges are outside the area, measured when its width
	// changes
	let insets = $state({ left: 0, right: 0, bottom: 0 })

	$effect(() => {
		void width
		const card = area?.closest('[data-sticker-bounds]')
		if (!area || !card) return
		const a = area.getBoundingClientRect()
		const c = card.getBoundingClientRect()
		insets = { left: a.left - c.left, right: c.right - a.right, bottom: c.bottom - a.bottom }
	})

	const bounds = $derived(stickerBounds(width, HEIGHT, insets, size))
	const clamp = (left: number, top: number) => clampPoint(bounds, left, top)
	const toX = (left: number) => toFraction(bounds, left)
	const fromX = (x: number) => fromFraction(bounds, x)

	// Placements are kept by the given sticker's id, except the viewer's own,
	// which is kept as OWN_KEY: it exists (optimistically) before the refetch
	// that would give it an id, and keeps its spot when swapped for another
	const OWN_KEY = 'mine'

	// The viewer's placement while it's being dropped or moved, ahead of the
	// server's
	let ownPlacement = $state<StickerPlacement | null>(null)
	// The viewer's sticker while it's being dragged within the area
	let moving = $state<string | null>(null)

	const placements = $derived.by(() => {
		const byKey: Record<string, StickerPlacement> = {}
		for (const given of placed ?? []) {
			if (given.placement) byKey[given.mine ? OWN_KEY : given.id] = given.placement
		}
		if (ownPlacement) byKey[OWN_KEY] = ownPlacement
		return byKey
	})

	const shown = $derived.by(() => {
		const entries = (placed ?? []).flatMap((given) => {
			if (given.mine) return mySticker ? [{ key: OWN_KEY, slug: mySticker, own: true }] : []
			return [{ key: given.id, slug: given.sticker, own: false }]
		})
		if (mySticker && !entries.some((entry) => entry.own)) {
			entries.push({ key: OWN_KEY, slug: mySticker, own: true })
		}
		return entries
			.map((entry) => ({ ...entry, sticker: findSticker(stickersQuery.data, entry.slug) }))
			.filter((entry) => entry.sticker)
	})

	// The viewer's sticker holds its spot and the others make room; while
	// it's being moved it's left out, and it finds a free spot when let go
	const layout = $derived(
		layoutStickers({
			entries: shown.map((entry) => ({ key: entry.key, placement: placements[entry.key] ?? null })),
			width,
			height: HEIGHT,
			size,
			bounds,
			anchored: OWN_KEY,
			excluded: moving
		})
	)

	function position(key: string) {
		const item = layout.get(key)
		return item ?? { left: 0, top: ROW_TOP, rotation: null }
	}

	// Somewhere clear of everyone else's stickers, near (left, top)
	function freeSpot(left: number, top: number): Point {
		const others = [...layout.values()].filter((item) => item.key !== OWN_KEY)
		return findFreeSpot(others, bounds, size, left, top)
	}

	// The area's size is known (only in the browser), so stickers can be drawn
	// where they belong
	const ready = $derived(width > 0)

	// Stickers mounting while this is set arrive as a batch: they fade in and
	// slap down in turn. Set for the first stickers after load, and again for
	// unfolding; cleared once that batch is on screen.
	let revealing = true

	function revealNextBatch() {
		revealing = true
		void tick().then(() => (revealing = false))
	}

	$effect(() => {
		if (ready) void tick().then(() => (revealing = false))
	})

	function placementAt(clientX: number, clientY: number): StickerPlacement | null {
		if (!area) return null
		const rect = area.getBoundingClientRect()
		if (!withinBounds(bounds, size, clientX - rect.left, clientY - rect.top)) return null
		// The pointer holds the sticker by its center; too close to another and
		// it goes to the nearest free spot instead
		const { left, top } = freeSpot(clientX - rect.left - size / 2, clientY - rect.top - size / 2)
		return { x: toX(left), y: top, rotation: null }
	}

	// Stickers waiting to land, and the elements of those on screen. Plain
	// maps: bookkeeping for the landing animation, nothing renders from them.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const landing = new Map<string, StickerDrop>()
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const elements = new Map<string, HTMLElement>()

	// Whatever is dropped becomes the viewer's sticker (the picker saves it)
	function place(_slug: string, placement: StickerPlacement, drop: StickerDrop) {
		const key = OWN_KEY
		const before = ownPlacement
		ownPlacement = placement
		landing.set(key, drop)
		// Already on screen (moving your own sticker): land now. Otherwise it
		// lands when it mounts, once the give goes through.
		void tick().then(() => {
			const el = elements.get(key)
			if (el) land(key, el)
		})
		return () => {
			ownPlacement = before
			landing.delete(key)
		}
	}

	function land(key: string, el: HTMLElement) {
		const drop = landing.get(key)
		if (!drop) return
		landing.delete(key)
		landSticker(el, drop)
	}

	function trackSticker(
		el: HTMLElement,
		{ key, order, rotation }: { key: string; order: number; rotation: number | null }
	) {
		elements.set(key, el)
		// Part of a batch, rather than dropped
		if (revealing && !landing.has(key)) revealSticker(el, order, rotation)
		land(key, el)
		return {
			destroy() {
				if (elements.get(key) === el) elements.delete(key)
			}
		}
	}

	$effect(() => {
		if (canGive) return stage.registerDropZone({ placementAt, place })
	})

	const expanded = $derived(canGive && stage.drag.sticker !== null)

	// A shade of the team's element; teams without one use the accent (see
	// .area's defaults)
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
		if (folded) revealNextBatch()
		openedHere = false
		saveStickersFolded(foldSetting, !folded)
	}

	$effect(() => {
		if (expanded && folded) {
			revealNextBatch()
			openedHere = true
		}
	})

	// Empty and not dragging: no room at all, so teams without stickers look
	// as before until someone starts dragging one
	const height = $derived(expanded ? EXPANDED_HEIGHT : shown.length > 0 && !folded ? HEIGHT : 0)

	// Taking your own sticker back
	function remove() {
		ownPlacement = null
		void actions.remove()
	}

	// Clicking an empty spot to give a sticker there, before you've given one:
	// a (+) follows the mouse, stays where you clicked while the picker is
	// open, and the sticker you pick lands on it
	const canAdd = $derived(canGive && !mySticker && !expanded && !folded)
	// Where the mouse last was over empty space; it stays put while the (+)
	// fades out over a sticker or off the area
	let hoverAt = $state<{ left: number; top: number } | null>(null)
	let hovering = $state(false)
	// Where the (+) was clicked, while the picker it opened is open
	// Raw, so the anchor stays the object the picker request holds
	let pinned = $state.raw<{ anchor: PickerAnchor; at: Point } | null>(null)
	const pinnedAt = $derived(pinned && stage.request.anchor === pinned.anchor ? pinned.at : null)
	const addAt = $derived(canAdd ? (pinnedAt ?? hoverAt) : null)
	const addShown = $derived(pinnedAt !== null || hovering)
	// Pressed like a button while the mouse is down on empty space
	let addPressed = $state(false)

	function pressArea(event: PointerEvent) {
		if (!canAdd || event.button !== 0 || overSticker(event)) return
		addPressed = true
		window.addEventListener('pointerup', () => (addPressed = false), { once: true })
	}

	function overSticker(event: Event) {
		return (event.target as Element | null)?.closest('.placed') != null
	}

	function hoverArea(event: PointerEvent) {
		if (!area || event.pointerType !== 'mouse' || overSticker(event)) {
			hovering = false
			return
		}
		const rect = area.getBoundingClientRect()
		hoverAt = { left: event.clientX - rect.left, top: event.clientY - rect.top }
		hovering = true
	}

	function clickArea(event: MouseEvent) {
		if (!canAdd || !area || overSticker(event)) return
		const placement = placementAt(event.clientX, event.clientY)
		if (!placement) return
		const rect = area.getBoundingClientRect()
		const at = { left: event.clientX - rect.left, top: event.clientY - rect.top }
		// Measured live, so the menu stays by the spot if the page scrolls
		const el = area
		const anchor: PickerAnchor = {
			getBoundingClientRect: () => {
				const now = el.getBoundingClientRect()
				return DOMRect.fromRect({
					x: now.left + at.left - ADD_MARKER_SIZE / 2,
					y: now.top + at.top - ADD_MARKER_SIZE / 2,
					width: ADD_MARKER_SIZE,
					height: ADD_MARKER_SIZE
				})
			}
		}
		pinned = { anchor, at }
		stage.requestPicker(anchor, placement)
	}

	// Moving your own sticker within the area

	function pressOwn(event: PointerEvent, key: string) {
		if (event.button !== 0 || !area) return
		event.preventDefault()
		const target = event.currentTarget as HTMLElement
		const rect = area.getBoundingClientRect()
		const start = position(key)
		const offsetX = event.clientX - rect.left - start.left
		const offsetY = event.clientY - rect.top - start.top
		const before = ownPlacement
		let x = placements[key]?.x ?? toX(start.left)
		let y = placements[key]?.y ?? start.top

		// It leans with the drag like a sticker from the picker, and keeps the
		// lean it had when let go
		trackDrag(event, {
			start() {
				moving = key
			},
			move(e) {
				const { left, top } = clamp(e.clientX - rect.left - offsetX, e.clientY - rect.top - offsetY)
				x = toX(left)
				y = top
			},
			frame(tilt) {
				ownPlacement = { x, y, rotation: tilt }
			},
			drop(_e, tilt) {
				// Let go too close to another sticker: slide to the nearest free spot
				const spot = freeSpot(fromX(x), y)
				ownPlacement = { x: toX(spot.left), y: spot.top, rotation: tilt }
				moving = null
				// Couldn't save: back where it was
				if (mySticker) {
					void actions.move(mySticker, ownPlacement).then((saved) => {
						if (!saved) ownPlacement = before
					})
				}
			},
			// Clicked: open the picker by it, to swap it for another
			click() {
				if (canGive) stage.requestPicker(target, null)
			},
			// Lost the pointer: back where it was, unsaved
			cancel() {
				ownPlacement = before
				moving = null
			}
		})
	}
</script>

{#if shown.length > 0 || canGive}
	<!-- Clicking empty space is a mouse shortcut; the keyboard has Add sticker -->
	<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
	<div
		class="area"
		class:expanded
		class:collapsed={height === 0 && !folded}
		class:drop-ready={expanded && stage.drag.overZone}
		bind:this={area}
		bind:clientWidth={width}
		style:height="{height}px"
		style:--zone-accent={elementColor('text')}
		style:--zone-fill={elementColor('bg')}
		style:--zone-bright={elementColor('button-bg')}
		role="list"
		aria-label={m.sticker_labels_aria()}
		onpointermove={hoverArea}
		onpointerleave={() => (hovering = false)}
		onpointerdown={pressArea}
		onclick={clickArea}
	>
		{#if canGive}
			<!-- Where a dragged sticker can go: a marching dashed outline -->
			<div class="zone" aria-hidden="true">
				<svg class="zone-border"><rect /></svg>
			</div>
		{/if}

		{#if addAt}
			<StickerAddMarker left={addAt.left} top={addAt.top} shown={addShown} pressed={addPressed} />
		{/if}

		{#each ready && !folded ? shown : [] as entry, index (entry.key)}
			{@const pos = position(entry.key)}
			{@const own = entry.own}
			<span
				role="listitem"
				class="placed"
				class:own
				class:moving={moving === entry.key}
				style:left="{pos.left}px"
				style:top="{pos.top}px"
				style:--placed-rotation={pos.rotation === null ? undefined : `${pos.rotation}deg`}
				onpointerdown={own ? (e) => pressOwn(e, entry.key) : undefined}
				use:trackSticker={{ key: entry.key, order: index, rotation: pos.rotation }}
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
	{#if shown.length > 0}
		<StickerFoldToggle {folded} onclick={toggleFolded} />
	{/if}
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;

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

	.zone {
		position: absolute;
		inset: 0;
		border-radius: layout.$item-corner;
		background: transparent;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.2s ease,
			background-color 0.2s ease;

		.expanded & {
			opacity: 1;
			background: color-mix(in srgb, var(--zone-fill) 20%, transparent);
		}

		.drop-ready & {
			background: color-mix(in srgb, var(--zone-fill) 40%, transparent);
		}
	}

	.zone-border {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: visible;

		rect {
			x: 1px;
			y: 1px;
			width: calc(100% - 2px);
			height: calc(100% - 2px);
			rx: 10px;
			fill: none;
			stroke: color-mix(in srgb, var(--zone-accent) 55%, transparent);
			stroke-width: 2;
			stroke-dasharray: 8 6;
			animation: march 0.8s linear infinite;
			transition: stroke 0.2s ease;
		}

		.drop-ready & rect {
			stroke: var(--zone-accent);
		}

		@media (prefers-reduced-motion: reduce) {
			rect {
				animation: none;
			}
		}
	}

	@keyframes march {
		to {
			stroke-dashoffset: -14;
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
