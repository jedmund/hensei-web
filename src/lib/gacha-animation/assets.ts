/**
 * The game's draw animation files: the CreateJS runtime, the two scene
 * timelines and their spritesheets. They live in the image bucket under
 * `app/gacha-animation/` (never in this repo) and are served from our own
 * origin by `routes/gacha-animation/[file]`, so `script-src 'self'` covers
 * the scripts.
 */

export const ANIMATION_PREFIX = 'app/gacha-animation'

/** Same-origin path the page loads the files from */
export const ANIMATION_ROUTE = '/gacha-animation'

/** Load in this order: the runtime first, then the scenes that use it */
export const ANIMATION_SCRIPTS = [
	'vendor_createjs-shell-amd-nocache.js',
	'cjs_gacha_new_2025_scene1.js',
	'cjs_gacha_new_2025_scene2.js'
] as const

/** Spritesheet ids the scenes draw from, and their files */
export const ANIMATION_IMAGES: Record<string, string> = {
	gacha_new_2025_scene1_a: 'gacha_new_2025_scene1_a.png',
	gacha_new_2025_scene1_c: 'gacha_new_2025_scene1_c.png',
	gacha_new_2025_scene1_d: 'gacha_new_2025_scene1_d.png',
	gacha_new_2025_scene1_e: 'gacha_new_2025_scene1_e.png',
	gacha_new_2025_scene1_bg_shinden_01: 'gacha_new_2025_scene1_bg_shinden_01.png',
	gacha_new_2025_scene1_bg_shinden_02_sky: 'gacha_new_2025_scene1_bg_shinden_02_sky.png',
	gacha_new_2025_scene1_bg_ssr01: 'gacha_new_2025_scene1_bg_ssr01.png',
	gacha_new_2025_scene1_bg_ssr02_2: 'gacha_new_2025_scene1_bg_ssr02_2.png',
	gacha_new_2025_scene2_a: 'gacha_new_2025_scene2_a.png',
	gacha_new_2025_scene2_b: 'gacha_new_2025_scene2_b.png',
	gacha_new_2025_scene2_c: 'gacha_new_2025_scene2_c.png',
	gacha_new_2025_scene2_bg_shinden_02_sky: 'gacha_new_2025_scene2_bg_shinden_02_sky.png',
	gacha_new_2025_scene2_bg_ssr02_2: 'gacha_new_2025_scene2_bg_ssr02_2.png',
	gacha_new_2025_scene2_gacha_scene03_bg: 'gacha_new_2025_scene2_gacha_scene03_bg.jpg',
	gacha_new_2025_scene2_gacya_window: 'gacha_new_2025_scene2_gacya_window.jpg'
}

/** Every file the route will serve; anything else is a 404 */
export const ANIMATION_FILES: ReadonlySet<string> = new Set([
	...ANIMATION_SCRIPTS,
	...Object.values(ANIMATION_IMAGES)
])

export const animationFileUrl = (file: string) => `${ANIMATION_ROUTE}/${file}`
