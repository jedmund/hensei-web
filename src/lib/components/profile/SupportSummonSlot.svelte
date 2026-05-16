<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import asteriskIcon from '$src/assets/icons/required-asterisk.svg?raw'
	import { getSummonImage, getSummonTransformation } from '$lib/utils/images'
	import type { SupportSummon, SupportSummonSection } from '$lib/types/api/supportSummon'

	interface Props {
		section: SupportSummonSection
		position: number
		summon?: SupportSummon | undefined
		isOwner?: boolean
		onSelect?: ((section: SupportSummonSection, position: number) => void) | undefined
		onToggleRequired?: ((summon: SupportSummon) => void) | undefined
	}

	let { section, position, summon, isOwner = false, onSelect, onToggleRequired }: Props = $props()

	const variant = $derived<'main' | 'wide'>(section === 'misc' ? 'wide' : 'main')

	const imageUrl = $derived.by(() => {
		if (!summon) return undefined
		const cs = summon.collectionSummon
		const transformation = getSummonTransformation(
			cs.summon?.granblueId,
			cs.uncapLevel,
			cs.transcendenceStep
		)
		return getSummonImage(cs.summon?.granblueId, variant, transformation)
	})

	const interactive = $derived(isOwner && !!onSelect)
	const canToggleRequired = $derived(isOwner && !!onToggleRequired && !!summon)

	// Stamp-like rotation: re-roll each time the slot is hovered/focused so
	// the badge feels like a fresh ink stamp rather than a polished UI chip.
	function randomStampRotation() {
		// Always lean left: -14° → -8°.
		return -8 - Math.floor(Math.random() * 7)
	}

	let stampRotation = $state(randomStampRotation())

	function rerollStamp() {
		stampRotation = randomStampRotation()
	}

	// After the user clicks to remove `required`, suppress the hover-preview
	// state until they actually leave the slot. Otherwise the badge would
	// linger at the hovered opacity (because the cursor hasn't moved), making
	// the click look unresponsive.
	let suppressHoverReveal = $state(false)

	function clearHoverReveal() {
		suppressHoverReveal = false
	}

	function handleClick() {
		if (!interactive) return
		onSelect?.(section, position)
	}

	function handleKey(event: KeyboardEvent) {
		if (!interactive) return
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			onSelect?.(section, position)
		}
	}

	function handleRequiredClick(event: MouseEvent) {
		event.stopPropagation()
		if (!summon || !onToggleRequired) return
		if (summon.required) suppressHoverReveal = true
		onToggleRequired(summon)
	}

	function handleRequiredKey(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault()
			event.stopPropagation()
			if (!summon || !onToggleRequired) return
			if (summon.required) suppressHoverReveal = true
			onToggleRequired(summon)
		}
	}
</script>

<div class="slot" class:misc={section === 'misc'}>
	<div
		class="frame-wrap"
		class:can-toggle-required={canToggleRequired}
		class:suppress-hover-reveal={suppressHoverReveal}
		onmouseenter={rerollStamp}
		onmouseleave={clearHoverReveal}
		onfocusin={rerollStamp}
		onfocusout={clearHoverReveal}
		role="presentation"
	>
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			class="frame"
			class:interactive
			class:filled={!!summon}
			role={interactive ? 'button' : undefined}
			tabindex={interactive ? 0 : undefined}
			onclick={handleClick}
			onkeydown={handleKey}
		>
			{#if imageUrl}
				<img
					class="image"
					src={imageUrl}
					alt={summon?.collectionSummon.summon?.name?.en ?? ''}
					loading="lazy"
				/>
			{:else}
				<div class="placeholder" aria-hidden="true"></div>
				{#if interactive}
					<span class="add-icon" aria-hidden="true">
						<Icon name="plus" size={24} />
					</span>
				{/if}
			{/if}
		</div>
		{#if summon}
			{@const isRequired = summon.required}
			{#if canToggleRequired}
				<button
					type="button"
					class="required-badge"
					class:active={isRequired}
					style:--stamp-rot="{stampRotation}deg"
					aria-pressed={isRequired}
					aria-label={isRequired
						? m.support_summon_unmark_required()
						: m.support_summon_mark_required()}
					title={isRequired ? m.support_summon_unmark_required() : m.support_summon_mark_required()}
					onclick={handleRequiredClick}
					onkeydown={handleRequiredKey}
				>
					{#if getLocale() === 'ja'}
						<span class="required-badge-glyph">必</span>
					{:else}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<span class="required-badge-glyph svg">{@html asteriskIcon}</span>
					{/if}
				</button>
			{:else if isRequired}
				<span
					class="required-badge static"
					style:--stamp-rot="{stampRotation}deg"
					aria-hidden="true"
				>
					{#if getLocale() === 'ja'}
						<span class="required-badge-glyph">必</span>
					{:else}
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						<span class="required-badge-glyph svg">{@html asteriskIcon}</span>
					{/if}
				</span>
			{/if}
		{/if}
	</div>
	{#if summon}
		<UncapIndicator
			type="summon"
			uncapLevel={summon.collectionSummon.uncapLevel}
			transcendenceStage={summon.collectionSummon.transcendenceStep}
			flb={summon.collectionSummon.summon?.uncap?.flb ?? false}
			ulb={summon.collectionSummon.summon?.uncap?.ulb ?? false}
			transcendence={summon.collectionSummon.summon?.uncap?.transcendence ?? false}
			size="medium"
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as effects;

	.slot {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		min-width: 0;
	}

	.frame-wrap {
		position: relative;
		width: 100%;
	}

	.frame {
		width: 100%;
		aspect-ratio: 196 / 340; // summon-main artwork
		border-radius: $card-corner;
		overflow: hidden;
		background: var(--placeholder-bg, rgba(0, 0, 0, 0.05));
		position: relative;
		transition: outline-color effects.$duration-quick ease;
		outline: 2px solid transparent;
		outline-offset: 2px;

		.misc & {
			aspect-ratio: 280 / 160; // summon-wide artwork
		}

		&.interactive {
			cursor: pointer;

			&:hover {
				outline-color: var(--focus-ring, rgba(0, 0, 0, 0.15));
			}

			&:focus-visible {
				outline-color: var(--focus-ring);
			}
		}
	}

	.image,
	.placeholder {
		width: 100%;
		height: 100%;
		display: block;
	}

	.image {
		object-fit: cover;
	}

	.placeholder {
		background: transparent;
	}

	// Centered + icon for empty interactive slots — matches empty `SummonUnit`.
	.add-icon {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: var(--icon-secondary, #999);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		transition: color effects.$duration-quick ease;
	}

	.frame.interactive:hover .add-icon {
		color: var(--icon-secondary-hover, #666);
	}

	// Required badge — jut out of the image's bottom-right by 25% of the
	// badge's own size. Hidden by default for owners; revealed on hover or
	// when the slot is already marked required. Always visible for viewers.
	.required-badge {
		--badge-size: 35px;
		--badge-color: #e23b3b;
		--stamp-rot: 0deg;
		position: absolute;
		bottom: calc(var(--badge-size) * -0.1);
		right: calc(var(--badge-size) * -0.1);
		width: var(--badge-size);
		height: var(--badge-size);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		border: 3px solid var(--badge-color);
		border-radius: 50%;
		background: transparent;
		color: var(--badge-color);
		font-family: inherit;
		cursor: pointer;
		// White halo around the circle stroke + glyph. drop-shadow follows the
		// rendered alpha (the ring + the text/SVG), unlike box-shadow which
		// follows the rectangular box, so it correctly haloes the ring shape.
		filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.95))
			drop-shadow(0 0 3px rgba(255, 255, 255, 0.85));
		transform: rotate(var(--stamp-rot));
		transition:
			opacity effects.$duration-quick ease,
			transform effects.$duration-quick ease;
		z-index: 1;

		&.static {
			cursor: default;
			pointer-events: none;
		}

		&:hover:not(.static) {
			transform: rotate(var(--stamp-rot)) scale(1.08);
		}

		&:focus-visible {
			outline: 2px solid var(--badge-color);
			outline-offset: 2px;
		}
	}

	.required-badge-glyph {
		font-size: 18px;
		font-weight: 800;
		line-height: 1;

		&.svg {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		&.svg :global(svg) {
			width: 100%;
			height: 100%;
			display: block;
		}
	}

	// Owner-only: keep the badge hidden until the slot is hovered, unless the
	// slot is already marked required (then it stays visible to signal state).
	// The toggle is perceptible because removal flips `suppress-hover-reveal`
	// (below), which hides the badge immediately even while still hovered.
	.frame-wrap.can-toggle-required .required-badge:not(.active) {
		opacity: 0;
		pointer-events: none;
	}

	.frame-wrap.can-toggle-required:hover .required-badge:not(.active),
	.frame-wrap.can-toggle-required:focus-within .required-badge:not(.active) {
		opacity: 1;
		pointer-events: auto;
	}

	// After a removal click, suppress the hover-reveal so the badge actually
	// disappears instead of hanging at full opacity until the cursor leaves.
	.frame-wrap.suppress-hover-reveal.can-toggle-required:hover .required-badge:not(.active),
	.frame-wrap.suppress-hover-reveal.can-toggle-required:focus-within .required-badge:not(.active) {
		opacity: 0;
		pointer-events: none;
	}
</style>
