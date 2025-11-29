<svelte:options runes={true} />

<script lang="ts">
	import UncapStar from './UncapStar.svelte'
	import TranscendenceStar from './TranscendenceStar.svelte'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		rarity?: number | undefined
		uncapLevel?: number | null | undefined
		transcendenceStage?: number | null | undefined
		flb?: boolean | undefined
		ulb?: boolean | undefined
		transcendence?: boolean | undefined
		special?: boolean | undefined
		className?: string | undefined
		editable?: boolean | undefined
		updateUncap?: ((index: number) => void) | undefined
		updateTranscendence?: ((index: number) => void) | undefined
	}

	interface StarRender {
		type: 'uncap' | 'transcendence'
		props: {
			index?: number
			onStarClick?: (index: number, empty: boolean) => void
			[key: string]: any
		}
	}

	let {
		type,
		rarity,
		uncapLevel = 0,
		transcendenceStage = 0,
		flb = false,
		ulb = false,
		transcendence = false,
		special = false,
		className,
		editable = false,
		updateUncap,
		updateTranscendence
	}: Props = $props()

	// Calculate the total number of stars to display
	const getNumStars = () => {
		if (type === 'character') {
			if (special) {
				// Special characters: 3 base + FLB + ULB
				return ulb ? 5 : flb ? 4 : 3
			} else {
				// Regular characters: 4 base + FLB + transcendence (ulb flag = transcendence for regular chars)
				return ulb ? 6 : flb ? 5 : 4
			}
		} else {
			// Weapons and summons: 3 base + FLB + ULB + transcendence
			return transcendence ? 6 : ulb ? 5 : flb ? 4 : 3
		}
	}

	const numStars = $derived(getNumStars())

	function toggleStar(index: number, empty: boolean) {
		if (updateUncap && editable) {
			if (empty && index > 0) {
				updateUncap(index + 1)
			} else {
				updateUncap(index)
			}
		}
	}

	function handleTranscendenceUpdate(stage: number) {
		if (updateTranscendence && editable) {
			updateTranscendence(stage)
		}
	}

	// Helper function to create star props
	const createStarProps = (starType: 'uncap' | 'transcendence', options: any = {}): StarRender => {
		if (starType === 'transcendence') {
			return {
				type: 'transcendence',
				props: {
					stage: transcendenceStage,
					type,
					editable,
					interactive: editable,
					onFragmentClick: editable ? handleTranscendenceUpdate : undefined
				}
			}
		}

		return {
			type: 'uncap',
			props: {
				empty: options.index >= (uncapLevel ?? 0),
				index: options.index,
				flb: options.flb,
				ulb: options.ulb,
				special: options.special,
				tabIndex: editable ? 0 : undefined,
				onStarClick: editable ? toggleStar : () => {}
			}
		}
	}

	// Determine what type of star to render at each position
	function renderStar(index: number): StarRender | null {
		// Handle transcendence star (always at position 5)
		if (index === 5) {
			if (type === 'character' && !special && transcendence) {
				// Regular character with transcendence (note: uses transcendence flag, not ulb)
				return createStarProps('transcendence')
			}
			if ((type === 'weapon' || type === 'summon') && transcendence) {
				// Weapon/summon with transcendence
				return createStarProps('transcendence')
			}
			return null
		}

		// Handle ULB star
		if (index === 4) {
			if (type === 'character' && special && ulb) {
				// Special character ULB at position 4
				return createStarProps('uncap', { index, ulb: true })
			}
			if (type === 'weapon' && ulb) {
				// Weapon ULB at position 4 (blue, not purple)
				return createStarProps('uncap', { index, flb: true })
			}
			if (type === 'summon' && ulb) {
				// Summon ULB at position 4 (blue, not purple)
				return createStarProps('uncap', { index, flb: true })
			}
		}

		// Handle FLB star
		if (index === 3) {
			if ((type === 'weapon' || type === 'summon' || (type === 'character' && special)) && flb) {
				// Weapon/summon/special character FLB at position 3
				return createStarProps('uncap', { index, flb: true })
			}
		}
		if (index === 4 && type === 'character' && !special && flb) {
			// Regular character FLB at position 4
			return createStarProps('uncap', { index, flb: true })
		}

		// Handle regular MLB stars (positions 0-2 for weapons/summons/special chars, 0-3 for regular chars)
		if (index < 3 || (type === 'character' && !special && index === 3)) {
			return createStarProps('uncap', { index })
		}

		return null
	}
</script>

<div class="uncap-indicator {className || ''}">
	<ul class="stars">
		{#each Array(numStars) as _, i}
			{@const star = renderStar(i)}
			{#if star}
				{#if star.type === 'transcendence'}
					<TranscendenceStar {...(star.props as any)} />
				{:else}
					<UncapStar {...(star.props as any)} />
				{/if}
			{/if}
		{/each}
	</ul>
</div>

<style lang="scss">
	.uncap-indicator {
		display: inline-block;
	}

	.stars {
		display: flex;
		gap: 2px;
		list-style: none;
		margin: 0;
		padding: 0;
		align-items: center;
	}
</style>
