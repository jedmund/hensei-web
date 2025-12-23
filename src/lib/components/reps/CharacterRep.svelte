<script lang="ts">
	import type { Party, GridWeapon, GridCharacter } from '$lib/types/api/party'
	import { getCharacterImageWithPose } from '$lib/utils/images'

	interface Props {
		party?: Party
		characters?: GridCharacter[]
		unlimited?: boolean
	}

	let { party, characters: directCharacters, unlimited = false }: Props = $props()

	// Use direct characters if provided, otherwise get from party
	const characters = $derived(directCharacters || party?.characters || [])
	// Show 5 characters (or 8 for unlimited) at positions 0-4 (or 0-7)
	const slotCount = $derived(unlimited ? 8 : 5)
	const grid = $derived(
		Array.from({ length: slotCount }, (_, i) =>
			characters.find((c: GridCharacter) => c?.position === i)
		)
	)

	// For standard mode: first 3 are portraits, last 2 are squares
	const portraits = $derived(unlimited ? [] : grid.slice(0, 3))
	const squares = $derived(unlimited ? [] : grid.slice(3, 5))

	function characterImageUrl(c: GridCharacter | undefined, position: number): string {
		const id = c?.character?.granblueId
		if (!id) return ''

		// Get mainhand weapon element for Gran/Djeeta
		let mainWeaponElement: number | undefined
		if (party) {
			const main: GridWeapon | undefined = (party.weapons || []).find(
				(w: GridWeapon) => w?.mainhand || w?.position === -1
			)
			mainWeaponElement = main?.element ?? main?.weapon?.element
		}

		// Use 'square' variant for unlimited mode or positions 3-4 in standard mode
		const variant = unlimited || position >= 3 ? 'square' : 'main'

		return getCharacterImageWithPose(
			id,
			variant,
			c?.uncapLevel ?? 0,
			c?.transcendenceStep ?? 0,
			mainWeaponElement,
			undefined // partyElement not used here
		)
	}
</script>

<div class="rep">
	{#if unlimited}
		<!-- Unlimited mode: 8 square slots in 4x2 grid -->
		<ul class="characters unlimited">
			{#each grid as c, i}
				<li class="character" class:empty={!c}>
					{#if c}<img
							alt="Character"
							src={characterImageUrl(c, i)}
							loading="lazy"
							decoding="async"
						/>{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<!-- Standard mode: 3 portraits + 2 stacked squares -->
		<div class="portraits">
			{#each portraits as c, i}
				<div class="character portrait" class:empty={!c}>
					{#if c}<img
							alt="Character"
							src={characterImageUrl(c, i)}
							loading="lazy"
							decoding="async"
						/>{/if}
				</div>
			{/each}
		</div>
		<div class="squares">
			{#each squares as c, i}
				<div class="character square" class:empty={!c}>
					{#if c}<img
							alt="Character"
							src={characterImageUrl(c, i + 3)}
							loading="lazy"
							decoding="async"
						/>{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;

	.rep {
		width: 100%;
		height: 100%;
		display: flex;
		gap: $unit-half;
		align-items: stretch; // Squares section stretches to match portraits height
	}

	// Standard mode: 3 portraits - each gets flex: 1 to share width equally
	.portraits {
		display: flex;
		gap: $unit-half;
		flex: 3; // Portraits section takes 3 parts

		.character {
			flex: 1;
			aspect-ratio: 16/33;
		}
	}

	// Standard mode: 2 stacked squares with forced gap
	.squares {
		display: flex;
		flex-direction: column;
		gap: $unit-half; // Forced minimum gap
		flex: 1; // Squares section takes 1 part

		.character {
			flex: 1; // Each takes half remaining height after gap
			aspect-ratio: 1/1;
			min-height: 0; // Allow shrinking to fit
		}
	}

	// Unlimited mode: 8 square slots in 4x2 grid
	.characters.unlimited {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $unit-half;
		margin: 0;
		padding: 0;
		list-style: none;
		width: 100%;

		.character {
			aspect-ratio: 1/1;
		}
	}

	// Shared character slot styles
	.character {
		background: var(--placeholder-bg);
		border-radius: 4px;
		box-sizing: border-box;
		overflow: hidden;

		&.empty {
			box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
		}

		img {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}
</style>
