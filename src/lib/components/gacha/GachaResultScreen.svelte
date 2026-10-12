<!-- GachaResultScreen - The game's results screen, shown in the draw animation's dialog -->

<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { animationFileUrl, RESULT_IMAGES } from '$lib/gacha-animation/assets'
	import { gachaItemFallbackImage, gachaItemName, gachaItemResultImage } from '$lib/utils/gacha'
	import { getGenericPlaceholder } from '$lib/utils/images'
	import type { Moon } from '$lib/gacha-animation/moons'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		/** The drawn items, in draw order */
		items: CatalogueItem[]
		/** The moon each item gives, in draw order */
		moons: Moon[]
		/** Identities of items whose character is new to the viewer */
		newCharacters: ReadonlySet<string>
		onDrawAgain?: (() => void) | undefined
	}

	let { items, moons, newCharacters, onDrawAgain }: Props = $props()

	/** The game lays the screen out 320px wide; it's scaled to fit */
	const LAYOUT_WIDTH = 320

	// The screen fills the animation's frame, so the dialog keeps its size
	let width = $state(LAYOUT_WIDTH)
	let height = $state(0)
	const zoom = $derived(width / LAYOUT_WIDTH)

	const title = $derived(
		items.length === 1 ? m.gacha_result_title_one() : m.gacha_result_title({ count: items.length })
	)

	// The game's Information panel: where the loot went, one line per kind of
	// moon, and the sparks the draw earned (one per draw)
	const informationLines = $derived.by(() => {
		const count = (moon: Moon) => moons.filter((value) => value === moon).length
		const line = (n: number, one: () => string, many: (p: { count: number }) => string) =>
			n === 0 ? [] : [n === 1 ? one() : many({ count: n })]
		return [
			m.gacha_result_crate(),
			...line(count(1), m.gacha_result_bronze_moon, m.gacha_result_bronze_moons),
			...line(count(2), m.gacha_result_silver_moon, m.gacha_result_silver_moons),
			...line(count(3), m.gacha_result_gold_moon, m.gacha_result_gold_moons),
			...line(items.length, m.gacha_result_spark, m.gacha_result_sparks)
		]
	})

	const image = (file: string) => `url(${animationFileUrl(file)})`

	// The art for a few items is missing: try their other art, then a placeholder
	function fallback(event: Event, item: CatalogueItem) {
		const img = event.currentTarget as HTMLImageElement
		const tries = [gachaItemFallbackImage(item, 'weapon'), getGenericPlaceholder()].filter(
			(src): src is string => Boolean(src)
		)
		const next = tries[Number(img.dataset.fallback ?? 0)]
		if (!next) return
		img.dataset.fallback = String(Number(img.dataset.fallback ?? 0) + 1)
		img.src = next
	}
</script>

<div
	class="screen"
	bind:clientWidth={width}
	bind:clientHeight={height}
	style:--background={image(RESULT_IMAGES.background)}
	style:--panel={image(RESULT_IMAGES.panel)}
	style:--parts={image(RESULT_IMAGES.parts)}
	style:--button={image(RESULT_IMAGES.button)}
	style:--line-detail={image(RESULT_IMAGES.lineDetail)}
>
	<div class="layout" style:zoom style:height={height > 0 ? `${height / zoom}px` : undefined}>
		<div class="result">
			<h2 class="title">{title}</h2>
			<!-- Rows of 3, 4 and 3, as in the game -->
			<div class="thumbnails">
				{#each items as item, index (index)}
					<div class="tile">
						<img
							src={gachaItemResultImage(item)}
							alt={gachaItemName(item, getLocale())}
							onerror={(event) => fallback(event, item)}
						/>
						{#if newCharacters.has(item.identity)}
							<div class="new" aria-hidden="true"></div>
						{/if}
					</div>
					{#if index === 2 || index === 6}<br />{/if}
				{/each}
			</div>
			{#if onDrawAgain}
				<button type="button" class="again" onclick={onDrawAgain}>{m.gacha_draw_again()}</button>
			{/if}
		</div>
		<div class="information">
			<h3>{m.gacha_result_information()}</h3>
			<ul>
				{#each informationLines as line (line)}
					<li>{line}</li>
				{/each}
			</ul>
		</div>
	</div>
</div>

<style lang="scss">
	// Sizes and sprite positions are the game's own, in its 320px layout. Its
	// sprite sheets are drawn at 1.5×, so each is shown at two-thirds size.
	.screen {
		position: absolute;
		inset: 0;
		overflow: hidden;
		background: #000;
		color: #f2eee2;
		font-family: 'Hiragino Mincho ProN', 'Yu Mincho', 'Noto Serif JP', Georgia, serif;
		font-size: 12px;
		line-height: 1;
		animation: gacha-result-in 300ms ease-out both;
	}

	.layout {
		display: flex;
		flex-direction: column;
		width: 320px;
	}

	// As tall as its rows, 299px for a 10-draw, as in the game
	.result {
		padding: 35px 0 15px;
		background: var(--background) no-repeat;
		background-size: 320px auto;
		text-align: center;
	}

	.title {
		box-sizing: border-box;
		width: 208px;
		height: 21px;
		margin: 0 auto 15px;
		padding-top: 4px;
		background: var(--parts) no-repeat 0 -4416px;
		background-size: 320px 5710px;
		font-size: 12px;
		font-weight: normal;
		line-height: 1;
		text-shadow:
			0 0 1px #150f0f,
			0 0 1px #150f0f,
			0 0 1px #150f0f,
			0 0 2px #150f0f,
			0 0 2px #150f0f,
			0 0 2px #150f0f;
	}

	.thumbnails {
		font-size: 0;
		line-height: 0;
	}

	// Fixed size, so an image that fails to load can't move the rows
	.tile {
		position: relative;
		display: inline-block;
		width: 75px;
		height: 43px;
		margin: 0 1px 14px;
		vertical-align: top;

		img {
			display: block;
			width: 100%;
			height: 100%;
			overflow: hidden;
		}
	}

	.new {
		position: absolute;
		top: -5px;
		left: -3px;
		width: 32px;
		height: 12px;
		background: var(--parts) no-repeat 0 -5203px;
		background-size: 320px 5710px;
		animation: gacha-result-riseup 2s linear 0s 5 normal;
	}

	.again {
		box-sizing: border-box;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 162px;
		height: 42px;
		// The bar is the sprite's top 31px (a shadow fills the rest); the text
		// sits on its middle, as the game's line box puts it
		padding: 0 0 6px;
		border: 0;
		background: var(--button) no-repeat 0 -1035px;
		background-size: 230px 3466px;
		color: #f2eee2;
		font: inherit;
		font-size: 10px;
		line-height: 1.1;
		vertical-align: top;
		cursor: pointer;
		text-shadow:
			0 0 1px #253544,
			0 0 1px #253544,
			0 0 1px #253544,
			0 0 1px #253544,
			0 0 2px #253544,
			0 0 2px #253544,
			0 0 2px #253544,
			0 0 2px #253544;

		&:hover,
		&:focus-visible {
			outline: none;
			filter: brightness(1.12);
		}
	}

	// Fills the rest of the animation's frame, so the dialog keeps its size
	.information {
		position: relative;
		z-index: 1;
		flex: 1;
		box-sizing: border-box;
		width: 320px;
		min-height: 40px;
		margin: -10px 0 0;
		padding: 10px 10px 15px;
		text-align: left;

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			z-index: -1;
			border-style: solid;
			border-width: 20px 0;
			border-image: var(--panel) 30 0 fill stretch round;
		}

		h3 {
			margin: 0;
			padding: 0 0 8px 25px;
			background: var(--line-detail) no-repeat center bottom;
			background-size: 293px 3px;
			font-size: 10px;
			font-weight: normal;
			line-height: 1;
		}

		ul {
			margin: 0;
			padding: 0;
			list-style: none;
			line-height: 1.4;
		}

		li {
			padding-left: 13px;
			text-indent: -16px;

			&::before {
				content: '';
				display: inline-block;
				width: 13px;
				height: 16px;
				margin-right: 3px;
				vertical-align: middle;
				background: var(--parts) no-repeat 0 -5653px;
				background-size: 320px 5710px;
			}
		}
	}

	@keyframes gacha-result-in {
		from {
			opacity: 0;
		}
	}

	@keyframes gacha-result-riseup {
		0% {
			transform: translate(0, 7px);
			opacity: 0;
		}
		15% {
			transform: translate(0, 1px);
			opacity: 1;
		}
		85% {
			transform: translate(0, -1px);
			opacity: 1;
		}
		100% {
			transform: translate(0, -7px);
			opacity: 0;
		}
	}
</style>
