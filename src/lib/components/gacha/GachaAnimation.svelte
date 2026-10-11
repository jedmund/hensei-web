<!-- GachaAnimation - Draw animation played before a 10-draw's results -->

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'
	import { Dialog as DialogBase } from 'bits-ui'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { gachaItemCardFallbackImage, gachaItemCardImage } from '$lib/utils/gacha'
	import { FIRST_PHASE, nextPhase, phaseDuration, type Phase } from '$lib/gacha-animation/sequence'
	import type { Presentation, Rarity } from '$lib/gacha-animation/presentation'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		/** The drawn items, in draw order */
		items: CatalogueItem[]
		presentation: Presentation
		/** Called when the animation ends or is skipped */
		onDone: () => void
	}

	let { items, presentation, onDone }: Props = $props()

	let phase = $state<Phase>(FIRST_PHASE)
	let finished = false

	const RARITY: Record<number, Rarity> = { 1: 'R', 2: 'SR', 3: 'SSR' }
	const revealed = $derived(phase.kind === 'reveal' ? items[phase.index] : undefined)
	const itemName = (item: CatalogueItem) => (getLocale() === 'ja' && item.name.ja) || item.name.en

	function finish() {
		if (finished) return
		finished = true
		onDone()
	}
	function advance() {
		phase = nextPhase(phase, items.length)
	}

	// Each phase moves on by itself; a tap moves on early
	$effect(() => {
		const duration = phaseDuration(phase)
		if (duration === null) {
			finish()
			return
		}
		const timer = setTimeout(advance, duration)
		return () => clearTimeout(timer)
	})

	// Load the card art while the opening plays
	onMount(() => {
		for (const item of items) new Image().src = gachaItemCardImage(item)
	})

	// One fallback attempt, so a missing fallback can't loop
	function useFallback(event: Event, item: CatalogueItem) {
		const img = event.currentTarget as HTMLImageElement
		if (img.dataset.fallback) return
		img.dataset.fallback = 'true'
		img.src = gachaItemCardFallbackImage(item)
	}
</script>

<!-- The dialog handles the portal, focus trap, scroll lock and Escape (skip) -->
<DialogBase.Root open onOpenChange={(open) => !open && finish()}>
	<DialogBase.Portal>
		<DialogBase.Overlay class="gacha-animation-backdrop" />
		<DialogBase.Content class="gacha-animation" aria-label={m.gacha_animation()}>
			<button type="button" class="stage" aria-label={m.gacha_animation_next()} onclick={advance}>
				{#if phase.kind === 'opening'}
					<div class="scene" out:fade={{ duration: 150 }}>
						<div class="crystal {presentation.crystal}"></div>
					</div>
				{:else if phase.kind === 'stones'}
					<div class="scene" out:fade={{ duration: 150 }}>
						<ul class="stones">
							{#each presentation.stones as stone, index (index)}
								<li class="stone" style:--delay="{index * 80}ms">
									<span class="gem {stone.startsAs.toLowerCase()}"></span>
									{#if stone.startsAs !== stone.rarity}
										<span class="gem classup {stone.rarity.toLowerCase()}"></span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{:else if revealed}
					{@const rarity = RARITY[revealed.rarity] ?? 'R'}
					{#key phase.kind === 'reveal' && phase.index}
						<div class="scene reveal {rarity.toLowerCase()}" in:fade={{ duration: 150 }}>
							<img
								class="card"
								src={gachaItemCardImage(revealed)}
								alt=""
								onerror={(event) => useFallback(event, revealed)}
							/>
							<div class="caption" aria-live="polite">
								<span class="rarity">{rarity}</span>
								<span class="name">{itemName(revealed)}</span>
								<span class="progress">
									{m.gacha_reveal_progress({
										current: (phase.kind === 'reveal' ? phase.index : 0) + 1,
										total: items.length
									})}
								</span>
							</div>
						</div>
					{/key}
				{/if}
			</button>
			<div class="skip">
				<Button variant="secondary" size="small" type="button" onclick={finish}>
					{m.gacha_skip()}
				</Button>
			</div>
		</DialogBase.Content>
	</DialogBase.Portal>
</DialogBase.Root>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as effects;

	// The stage is always dark, like the game's, in either theme
	:global(.gacha-animation-backdrop) {
		position: fixed;
		inset: 0;
		z-index: effects.$z-modal;
		background: rgb(0 0 0 / 0.9);
	}

	:global(.gacha-animation) {
		position: fixed;
		inset: 0;
		z-index: effects.$z-modal + 1;
		display: flex;
		align-items: center;
		justify-content: center;

		&:focus {
			outline: none;
		}
	}

	.stage {
		position: relative;
		width: min(100vw, calc(100dvh * 640 / 920));
		aspect-ratio: 640 / 920;
		max-height: 100dvh;
		padding: 0;
		border: 0;
		overflow: hidden;
		cursor: pointer;
		color: #fff;
		background: radial-gradient(
			ellipse at 50% 40%,
			#f6e7c1 0%,
			#b99a5b 35%,
			#3b3020 75%,
			#15110b 100%
		);

		@media (min-width: 769px) {
			border-radius: $page-corner;
		}
	}

	.scene {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	// Opening: the crystal floats in, glowing in its tell colour
	.crystal {
		--glow: #9ec9ff;
		width: 28%;
		aspect-ratio: 1 / 2.4;
		clip-path: polygon(50% 0, 100% 42%, 50% 100%, 0 42%);
		filter: drop-shadow(0 0 $unit-3x var(--glow));
		animation:
			crystal-in 700ms ease-out both,
			crystal-float 2.4s ease-in-out 700ms infinite;

		&.blue {
			background: linear-gradient(160deg, #d6ecff, #4a8fe0 45%, #1d4fa8);
		}

		&.violet {
			--glow: #c7a6ff;
			background: linear-gradient(160deg, #e6dcff, #5e7fe6 40%, #8a4fd6 75%, #c86fd0);
		}

		&.gold {
			--glow: #ffd27a;
			background: linear-gradient(160deg, #fff3c4, #f2b33d 40%, #e07a2a 70%, #3d74d8);
		}

		&.rainbow {
			--glow: #fff;
			background: linear-gradient(
				160deg,
				#ff8fb1,
				#ffd27a 20%,
				#9be7a0 40%,
				#7cc7ff 60%,
				#b38cff 80%,
				#ff8fb1
			);
		}
	}

	@keyframes crystal-in {
		from {
			opacity: 0;
			transform: translateY($unit-4x) scale(0.6);
		}
	}

	@keyframes crystal-float {
		50% {
			transform: translateY(-$unit);
		}
	}

	// Stones: one per item, landing in turn; class-ups change colour late
	.stones {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: $unit-3x $unit-2x;
		width: 80%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.stone {
		position: relative;
		aspect-ratio: 1 / 1.8;
		animation: stone-in 400ms ease-out var(--delay) both;
	}

	.gem {
		position: absolute;
		inset: 0;
		clip-path: polygon(50% 0, 100% 42%, 50% 100%, 0 42%);

		&.r {
			background: linear-gradient(160deg, #d6ecff, #4a8fe0 50%, #1d4fa8);
		}

		&.sr {
			background: linear-gradient(160deg, #fff3c4, #e2b23a 50%, #8a5a12);
		}

		&.ssr {
			background: linear-gradient(160deg, #ff8fb1, #ffd27a 30%, #9be7a0 55%, #7cc7ff 75%, #b38cff);
		}

		&.classup {
			animation: classup 300ms ease-in calc(var(--delay) + 1200ms) both;
		}
	}

	@keyframes stone-in {
		from {
			opacity: 0;
			transform: translateY(-$unit-6x) scale(0.5);
		}
	}

	@keyframes classup {
		from {
			opacity: 0;
			transform: scale(1.4);
		}
	}

	// Reveal: the item's card art, with its rarity and name
	.reveal {
		flex-direction: column;
		gap: $unit-2x;
		padding: $unit-4x;

		&.ssr .card {
			filter: drop-shadow(0 0 $unit-3x #ffe28a);
		}

		&.sr .card {
			filter: drop-shadow(0 0 $unit-2x #fff3c4);
		}
	}

	.card {
		max-width: 90%;
		max-height: 62%;
		object-fit: contain;
		animation: card-in 300ms ease-out both;
	}

	@keyframes card-in {
		from {
			transform: scale(0.85);
		}
	}

	.caption {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		text-shadow: 0 1px 4px rgb(0 0 0 / 0.6);
	}

	.rarity {
		font-size: $font-xlarge;
		font-weight: $bold;
	}

	.name {
		font-size: $font-medium;
		font-weight: $medium;
	}

	.progress {
		font-size: $font-small;
		opacity: 0.8;
	}

	.skip {
		position: absolute;
		top: $unit-2x;
		right: $unit-2x;
	}
</style>
