<!-- GachaAnimation - The game's draw animation, played before a 10-draw's results -->

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
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
	import type { Presentation } from '$lib/gacha-animation/presentation'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		/** The drawn items, in draw order */
		items: CatalogueItem[]
		presentation: Presentation
		/** Called when the animation ends, is skipped or can't load */
		onDone: () => void
	}

	let { items, presentation, onDone }: Props = $props()

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
	/** Sub-clips whose labels show whether the scene is mid-animation */
	const CLIPS = ['scene1_1', 'scene1_2', 'scene1_3', 'scene2', 'scene3', 'scene4']

	let canvas = $state<HTMLCanvasElement>()
	let loaded = $state(false)
	let finished = false

	const itemName = (item: CatalogueItem) => (getLocale() === 'ja' && item.name.ja) || item.name.en

	function finish() {
		if (finished) return
		finished = true
		onDone()
	}

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
	// topmost layer that's listening
	function listeners(auto: boolean): any[] {
		const found: any[] = []
		const optional = auto ? (OPTIONAL_LAYERS[sceneName] ?? []) : []
		const walk = (node: any, depth: number) => {
			if (!node || depth > 6 || node.visible === false || node._off) return
			const name: string =
				node.name || Object.keys(node.parent ?? {}).find((key) => node.parent[key] === node) || ''
			if (node.parent === root && optional.includes(name)) return
			if (node.hasEventListener?.('click') && !/skip/i.test(name)) found.push(node)
			for (const child of node.children ?? []) walk(child, depth + 1)
		}
		walk(root, 0)
		return found
	}

	function tap(auto = false) {
		if (!root || finished) return
		const target = listeners(auto).at(-1)
		// The runtime doesn't export createjs.Event; a type string works
		target?.dispatchEvent('click')
	}

	/** Whether any of the scene's clips is mid-animation */
	function busy(): boolean {
		return CLIPS.some((key) => {
			const clip = root?.[key]
			if (!clip?.timeline) return false
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
			mount(SCENE2, scene2Params(items, presentation, items.map(itemName), skipped))
		} else {
			finish()
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
		}
	}
</script>

<Dialog open hideClose class="gacha-animation-dialog" onOpenChange={(open) => !open && finish()}>
	<button
		type="button"
		class="stage"
		class:loaded
		aria-label={m.gacha_animation_next()}
		onclick={() => tap()}
	>
		<canvas bind:this={canvas} width="640" height="920" aria-label={m.gacha_animation()}></canvas>
	</button>
	<div class="actions">
		<Button variant="secondary" size="small" type="button" onclick={finish}>
			{m.gacha_skip()}
		</Button>
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;

	// The canvas keeps the game's 640×920 frame, sized to fit the screen with
	// room for the actions row
	:global(.dialog-content.gacha-animation-dialog) {
		width: min(460px, 90vw, calc((90vh - #{$unit-8x}) * 640 / 920));
	}

	.stage {
		display: block;
		width: 100%;
		aspect-ratio: 640 / 920;
		padding: 0;
		border: 0;
		cursor: pointer;
		background: #000;

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
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		padding: $unit $unit-2x;
	}
</style>
