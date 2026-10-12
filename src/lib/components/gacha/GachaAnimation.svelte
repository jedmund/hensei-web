<!-- GachaAnimation - The game's draw animation and results screen, played before a draw's results -->

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import GachaResultScreen from '$lib/components/gacha/GachaResultScreen.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { untrack } from 'svelte'
	import { gachaItemCardFallbackImage, gachaItemCardImage } from '$lib/utils/gacha'
	import {
		blankImage,
		loadGameRuntime,
		loadImage,
		toImgMid,
		type GameRuntime
	} from '$lib/gacha-animation/runtime'
	import { scene1Params, scene2Params, type SceneParams } from '$lib/gacha-animation/scene'
	import type { Moon } from '$lib/gacha-animation/moons'
	import type { Presentation } from '$lib/gacha-animation/presentation'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		/** The drawn items, in draw order */
		items: CatalogueItem[]
		presentation: Presentation
		/** The moon each item gives, in draw order */
		moons: Moon[]
		/** Identities of items whose character is new to the viewer */
		newCharacters: ReadonlySet<string>
		/** Called once the dialog has closed, or when the animation can't load */
		onDone: () => void
		/**
		 * Called when the viewer chooses Draw Again. The dialog stays open, and
		 * plays the next draw when new items come in.
		 */
		onDrawAgain?: (() => void) | undefined
	}

	let { items, presentation, moons, newCharacters, onDone, onDrawAgain }: Props = $props()

	const FPS = 30
	const SCENE1 = 'gacha_new_2025_scene1'
	const SCENE2 = 'gacha_new_2025_scene2'
	/**
	 * How long the animation waits for a tap before tapping by itself, in
	 * seconds. The game waits for every tap; here the opening's taps come
	 * quickly and each revealed item holds for a beat.
	 */
	const AUTO_TAP_AFTER: Record<string, number> = { [SCENE1]: 0.6, [SCENE2]: 1 }
	/** Scene 1's "tap to skip ahead" layers, which auto-tap leaves alone */
	const OPTIONAL_LAYERS: Record<string, string[]> = { [SCENE1]: ['bg2', 'bg3'] }
	/**
	 * The scenes' SKIP button hit area on the 640×920 frame: every skip layer
	 * is a 147×39 box centred at (318.5, 867.5)
	 */
	const SKIP_AREA = { left: 245, top: 848, right: 392, bottom: 887 }
	/** Sub-clips whose labels show whether the scene is mid-animation */
	const CLIPS = ['scene1_1', 'scene1_2', 'scene1_3', 'scene2', 'scene3', 'scene4']

	/** The white flash between the animation and the results screen */
	const FLASH_MS = 170
	/**
	 * The outro's length: a 170 ms white flash, then the dialog fades and
	 * shrinks over 280 ms (see the styles), plus a little room so it's gone
	 * before it's removed
	 */
	const OUTRO_MS = 520

	let canvas = $state<HTMLCanvasElement>()
	let loaded = $state(false)
	/**
	 * The animation plays, then the game's results screen holds until
	 * dismissed. After Draw Again, the stage waits for the next draw.
	 */
	let phase = $state<'playing' | 'results' | 'waiting'>('playing')
	let flashing = $state(false)
	let closing = $state(false)
	let finished = false

	const itemName = (item: CatalogueItem) => (getLocale() === 'ja' && item.name.ja) || item.name.en

	// The end of the animation and Skip flash white into the results screen
	function showResults() {
		if (phase !== 'playing' || flashing || finished) return
		flashing = true
		setTimeout(() => {
			phase = 'results'
			flashing = false
		}, FLASH_MS)
	}

	// Every way out (Close, Draw Again, Escape, a click outside) plays the
	// outro before the dialog goes
	function finish(then: () => void = onDone) {
		if (finished) return
		finished = true
		closing = true
		setTimeout(then, OUTRO_MS)
	}
	function finishInstead(event: Event) {
		event.preventDefault()
		finish()
	}

	// Draw Again flashes white and holds on a black stage until the next draw
	// comes in, then plays it in the same dialog
	function drawAgain() {
		if (!onDrawAgain || phase !== 'results' || flashing || finished) return
		flashing = true
		setTimeout(() => {
			phase = 'waiting'
			flashing = false
			onDrawAgain?.()
		}, FLASH_MS)
	}
	$effect(() => {
		void items
		untrack(() => {
			if (phase !== 'waiting') return
			loaded = false
			phase = 'playing'
		})
	})

	/* eslint-disable @typescript-eslint/no-explicit-any -- the game's untyped display objects */
	let runtime: GameRuntime | undefined
	let stage: any
	let root: any
	let sceneName = ''
	let idleFrames = 0

	function mount(name: string, params: SceneParams) {
		if (root) stage.removeChild(root)
		// The scenes also read the draw count as a global
		Object.assign(window, { cjs_gacha_num: items.length })
		root = new runtime!.lib[name]()
		Object.assign(root, params)
		stage.addChild(root)
		sceneName = name
		idleFrames = 0
	}

	// The scenes wait on clicks on full-screen layers, some transparent, which
	// the runtime's pixel hit test misses; send the click straight to the
	// topmost layer that's listening. The SKIP button's layers are separate,
	// and only take clicks on the button.
	function listeners(auto: boolean, skip = false): any[] {
		const found: any[] = []
		const optional = auto ? (OPTIONAL_LAYERS[sceneName] ?? []) : []
		const walk = (node: any, depth: number) => {
			if (!node || depth > 6 || node.visible === false || node._off) return
			const name: string =
				node.name || Object.keys(node.parent ?? {}).find((key) => node.parent[key] === node) || ''
			if (node.parent === root && optional.includes(name)) return
			if (node.hasEventListener?.('click') && /skip/i.test(name) === skip) found.push(node)
			for (const child of node.children ?? []) walk(child, depth + 1)
		}
		walk(root, 0)
		return found
	}

	/** Whether a click landed on the scene's SKIP button */
	function onSkipButton(event: MouseEvent): boolean {
		// Keyboard presses have no position
		if (!canvas || event.detail === 0) return false
		const rect = canvas.getBoundingClientRect()
		const x = ((event.clientX - rect.left) / rect.width) * canvas.width
		const y = ((event.clientY - rect.top) / rect.height) * canvas.height
		const { left, top, right, bottom } = SKIP_AREA
		return x >= left && x <= right && y >= top && y <= bottom
	}

	function tap(auto = false, skip = false) {
		if (!root || finished) return
		// A click on SKIP while it isn't listening counts as an ordinary tap
		const target = (skip && listeners(false, true).at(-1)) || listeners(auto).at(-1)
		// The runtime doesn't export createjs.Event; a type string works
		target?.dispatchEvent('click')
	}

	/** Whether any of the scene's shown clips is mid-animation */
	function busy(): boolean {
		return CLIPS.some((key) => {
			const clip = root?.[key]
			// A hidden clip keeps the label it stopped on, e.g. scene 2's "skip"
			// after SKIP jumps to the item list
			if (!clip?.timeline || clip._off || clip.visible === false) return false
			const label = clip.getCurrentLabel ? clip.getCurrentLabel() : clip.currentLabel
			// Scene 2's "open" and "skip" listen for a tap that cuts the item's
			// intro short, but move on by themselves
			return /_(play|set)$|^(open|skip)$/.test(label ?? '')
		})
	}

	function onTick() {
		if (!root || finished) return
		if (!busy() && listeners(true).length > 0) idleFrames++
		else idleFrames = 0
		if (idleFrames > FPS * (AUTO_TAP_AFTER[sceneName] ?? 1)) {
			idleFrames = 0
			tap(true)
		}
	}

	function onPlayEnd(event: Event) {
		if (sceneName === SCENE1) {
			const skipped = Boolean((event as CustomEvent).detail)
			mount(SCENE2, scene2Params(items, presentation, items.map(itemName), moons, skipped))
		} else {
			showResults()
		}
	}
	/* eslint-enable @typescript-eslint/no-explicit-any */

	/** Card art for each draw slot, falling back to the item's other art */
	async function loadCards(): Promise<CanvasImageSource[]> {
		return Promise.all(
			items.map((item) =>
				loadImage(gachaItemCardImage(item))
					.catch(() => loadImage(gachaItemCardFallbackImage(item)))
					.then(toImgMid)
					.catch(() => blankImage())
			)
		)
	}

	// The canvas renders inside the dialog's portal, after this component
	// mounts, so start once it's there
	$effect(() => {
		const target = canvas
		if (!target) return
		return untrack(() => start(target))
	})

	function start(target: HTMLCanvasElement) {
		let ticker: { removeEventListener: (type: string, fn: unknown) => void } | undefined
		target.addEventListener('playEnd', onPlayEnd)

		Promise.all([loadGameRuntime(getLocale()), loadCards()])
			.then(([game, cards]) => {
				if (finished) return
				runtime = game
				const { createjs, images } = game
				const blank = blankImage()
				for (let i = 1; i <= 10; i++) {
					const n = String(i).padStart(2, '0')
					images[`wepon_dummy${n}`] = cards[i - 1] ?? blank
					// New-character portraits and pickup art aren't used yet
					images[`npc_dummy${n}`] = blank
					images[`txt_popup_dummy${n}`] = blank
					for (let c = 1; c <= 3; c++) images[`charaup_dummy0${c}_${i}`] = blank
				}

				stage = new createjs.Stage(target)
				// Taps go straight to the layers (see listeners), so the runtime's
				// own pointer handling, which reads canvas pixels, stays off
				stage.enableDOMEvents?.(false)
				createjs.MotionGuidePlugin?.install()
				createjs.Ticker.setFPS(FPS)
				createjs.Ticker.setPaused(false)
				createjs.Ticker.addEventListener('tick', stage)
				createjs.Ticker.addEventListener('tick', onTick)
				ticker = createjs.Ticker
				mount(SCENE1, scene1Params(items, presentation))
				loaded = true
			})
			.catch((err) => {
				console.error('Gacha animation failed to load', err)
				finish()
			})

		return () => {
			target.removeEventListener('playEnd', onPlayEnd)
			ticker?.removeEventListener('tick', stage)
			ticker?.removeEventListener('tick', onTick)
			stage?.removeAllChildren()
			root = undefined
			// The runtime draws with WebGL; free the context, or after a dozen or
			// so draws the browser starts dropping the oldest
			for (const type of ['webgl2', 'webgl', 'experimental-webgl']) {
				const context = target.getContext(type) as WebGLRenderingContext | null
				if (context) {
					context.getExtension('WEBGL_lose_context')?.loseContext()
					break
				}
			}
		}
	}
</script>

<Dialog
	open
	hideClose
	class="gacha-animation-dialog {closing ? 'closing' : ''}"
	overlayClass={closing ? 'gacha-animation-closing' : ''}
	onEscapeKeydown={finishInstead}
	onInteractOutside={finishInstead}
>
	<!-- The animation's canvas is removed with the results screen, which stops it;
		a new canvas plays the next draw -->
	<div class="stage" class:flashing>
		{#if phase === 'playing'}
			<button
				type="button"
				class="canvas"
				class:loaded
				disabled={closing || flashing}
				aria-label={m.gacha_animation_next()}
				onclick={(event) => tap(false, onSkipButton(event))}
			>
				<canvas bind:this={canvas} width="640" height="920" aria-label={m.gacha_animation()}
				></canvas>
			</button>
		{:else if phase === 'results'}
			<GachaResultScreen {items} {moons} {newCharacters} onDrawAgain={onDrawAgain && drawAgain} />
		{/if}
	</div>
	<div class="actions">
		{#if phase !== 'results'}
			<Button
				variant="secondary"
				size="small"
				type="button"
				disabled={closing || flashing || phase === 'waiting'}
				onclick={showResults}
			>
				{m.gacha_skip()}
			</Button>
		{:else}
			<Button
				variant="secondary"
				size="small"
				type="button"
				disabled={closing}
				onclick={() => finish()}
			>
				{m.modal_close()}
			</Button>
		{/if}
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	// The canvas keeps the game's 640×920 frame, sized to fit the screen with
	// room for the actions row
	:global(.dialog-content.gacha-animation-dialog) {
		width: min(460px, 90vw, calc((90vh - #{$unit-8x}) * 640 / 920));
	}

	// Outro: the stage flashes white, then the dialog fades and shrinks away
	// while the backdrop lifts
	:global(.dialog-content.gacha-animation-dialog.closing) {
		pointer-events: none;
		animation: gacha-outro 280ms ease-in 170ms both;
	}

	:global(.dialog-overlay.gacha-animation-closing) {
		animation: gacha-backdrop-out 300ms ease-in 150ms both;
	}

	:global(.dialog-content.gacha-animation-dialog.closing) .stage::after,
	.stage.flashing::after {
		opacity: 1;
	}

	@keyframes gacha-outro {
		to {
			opacity: 0;
			transform: translate(-50%, -50%) scale(0.94);
		}
	}

	@keyframes gacha-backdrop-out {
		to {
			opacity: 0;
		}
	}

	.stage {
		position: relative;
		width: 100%;
		aspect-ratio: 640 / 920;
		overflow: hidden;
		background: #000;

		// The white flash, faded in into the results screen and by the outro
		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: #fff;
			opacity: 0;
			transition: opacity 170ms ease-out;
			pointer-events: none;
		}
	}

	.canvas {
		display: block;
		width: 100%;
		height: 100%;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;

		canvas {
			display: block;
			width: 100%;
			height: 100%;
			opacity: 0;
			transition: opacity 200ms ease;
		}

		&.loaded canvas {
			opacity: 1;
		}

		&:disabled {
			cursor: default;
		}
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		padding: $unit $unit-2x;
	}
</style>
