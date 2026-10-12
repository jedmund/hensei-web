/**
 * Loads the game's CreateJS runtime and draw scenes into the page, once.
 * They're plain scripts written for the game's page, so they get the few
 * globals they expect from it:
 *
 * - `define`: the runtime is an AMD module; the shim keeps its export as
 *   `createjs` (no `define.amd`, so other UMD code ignores it)
 * - `require`: the scenes load sound modules; they get a silent stub
 * - `$`: the scenes only call `$(canvas).trigger(name, arg)`, which becomes
 *   a DOM CustomEvent on the canvas
 * - `Game.lang`, `lib` (scene classes) and `images` (spritesheets by id)
 *
 * Browser only.
 */

import { ANIMATION_IMAGES, ANIMATION_SCRIPTS, animationFileUrl } from './assets'

/* eslint-disable @typescript-eslint/no-explicit-any -- the game's untyped globals */
export interface GameRuntime {
	createjs: any
	/** Scene classes by name */
	lib: Record<string, any>
	/** The images the scenes draw, by id; fill in place, the scenes keep a reference */
	images: Record<string, CanvasImageSource>
}

type GameWindow = Window & Record<string, any>
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * The game draws its `img_mid` art, 75% of full size, at this ratio
 * (`Game.cjsScale`). The spritesheets are `img_mid` already; card art is
 * mirrored at full size, so it's scaled down with {@link toImgMid}.
 */
const PIXEL_RATIO = 0.75

let loading: Promise<GameRuntime> | undefined

export function loadGameRuntime(lang: string): Promise<GameRuntime> {
	const win = window as GameWindow
	win.Game = { ...win.Game, lang }
	loading ??= load(win).catch((err) => {
		// Let the next draw try again
		loading = undefined
		throw err
	})
	return loading
}

async function load(win: GameWindow): Promise<GameRuntime> {
	const silent = new Proxy({}, { get: () => () => undefined })
	win.define ??= (mod: unknown) => {
		win.createjs = mod
	}
	win.require ??= (deps: unknown[], callback?: (...mods: unknown[]) => void) =>
		callback?.(...deps.map(() => silent))
	win.$ ??= (el: EventTarget) => ({
		trigger: (name: string, detail?: unknown) => el.dispatchEvent(new CustomEvent(name, { detail }))
	})
	win.lib ??= {}
	win.images ??= {}

	const sheets = loadSpritesheets()
	for (const file of ANIMATION_SCRIPTS) {
		await loadScript(animationFileUrl(file))
		if (file === ANIMATION_SCRIPTS[0]) win.createjs.Config.setPixelRatio(PIXEL_RATIO)
	}
	Object.assign(win.images, await sheets)

	return { createjs: win.createjs, lib: win.lib, images: win.images }
}

function loadScript(src: string): Promise<void> {
	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = src
		script.async = false
		script.onload = () => resolve()
		script.onerror = () => reject(new Error(`Couldn't load ${src}`))
		document.head.append(script)
	})
}

export function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = () => reject(new Error(`Couldn't load ${src}`))
		img.src = src
	})
}

async function loadSpritesheets(): Promise<Record<string, HTMLImageElement>> {
	const entries = await Promise.all(
		Object.entries(ANIMATION_IMAGES).map(
			async ([id, file]) => [id, await loadImage(animationFileUrl(file))] as const
		)
	)
	return Object.fromEntries(entries)
}

/** Scales full-size art to the `img_mid` size the scenes expect */
export function toImgMid(img: HTMLImageElement): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = Math.round(img.naturalWidth * PIXEL_RATIO)
	canvas.height = Math.round(img.naturalHeight * PIXEL_RATIO)
	canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
	return canvas
}

/** A transparent stand-in for images a scene expects but we don't have */
export function blankImage(): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	canvas.width = canvas.height = 2
	return canvas
}
