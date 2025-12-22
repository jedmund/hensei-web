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

	function characterImageUrl(c?: GridCharacter): string {
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

		return getCharacterImageWithPose(
			id,
			unlimited ? 'square' : 'main',
			c?.uncapLevel ?? 0,
			c?.transcendenceStep ?? 0,
			mainWeaponElement,
			undefined // partyElement not used here
		)
	}
</script>

<div class="rep">
	<ul class="characters" class:unlimited>
		{#each grid as c, i}
			<li class="character" class:empty={!c}>
				{#if c}<img
						alt="Character"
						src={characterImageUrl(c)}
						loading="lazy"
						decoding="async"
					/>{/if}
			</li>
		{/each}
	</ul>
</div>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;

	.rep {
		width: 100%;
		height: 100%;
		border-radius: $item-corner-small;
		grid-gap: $unit-half;

		.characters {
			display: grid;
			grid-template-columns: repeat(5, 1fr);
			gap: $unit-half;
			margin: 0;
			padding: 0;
			list-style: none;

			&.unlimited {
				grid-template-columns: repeat(4, 1fr);

				.character {
					aspect-ratio: 1/1;
				}
			}

			.character {
				aspect-ratio: 16/33;
				background: var(--placeholder-bg);
				border-radius: 4px;
				box-sizing: border-box;
				display: grid;
				overflow: hidden;

				&.empty {
					background: var(--placeholder-bg);
					box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
				}

				img {
					display: block;
					width: 100%;
					height: 100%;
					object-fit: cover;
				}
			}
		}
	}
</style>
