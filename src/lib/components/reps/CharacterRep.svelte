<script lang="ts">
	import type { Party, GridWeapon, GridCharacter } from '$lib/types/api/party'
	import { getElementClass } from '$lib/types/enums'
	import { getCharacterImage } from '$lib/features/database/detail/image'

	interface Props {
		party?: Party
		characters?: GridCharacter[]
		jobId?: string
		element?: number
		gender?: number
	}

	let { party, characters: directCharacters, jobId, element, gender }: Props = $props()

	// Use direct characters if provided, otherwise get from party (note: API returns gridCharacters)
	const characters = $derived(directCharacters || party?.gridCharacters || [])
	const grid = $derived(Array.from({ length: 3 }, (_, i) =>
		characters.find((c: GridCharacter) => c?.position === i)
	))

	const protagonistClass = $derived(
		// If element is directly provided, use it
		element ? getElementClass(element) :
		// Otherwise try to get from party's mainhand weapon
		party ? (() => {
			const main: GridWeapon | undefined = (party.gridWeapons || []).find(
				(w: GridWeapon) => w?.mainhand || w?.position === -1
			)
			const el = main?.element ?? main?.weapon?.element
			return getElementClass(el) || ''
		})() : ''
	)

	function characterImageUrl(c?: GridCharacter): string {
		const id = c?.character?.granblueId
		if (!id) return ''
		const uncap = c?.uncapLevel ?? 0
		const trans = c?.transcendenceStep ?? 0
		let suffix = '01'
		if (trans > 0) suffix = '04'
		else if (uncap >= 5) suffix = '03'
		else if (uncap > 2) suffix = '02'
		if (String(id) === '3030182000' && party) {
			const main: GridWeapon | undefined = (party.weapons || []).find(
				(w: GridWeapon) => w?.mainhand || w?.position === -1
			)
			const el = main?.element ?? main?.weapon?.element ?? 1
			suffix = `${suffix}_0${el}`
		}
		return `/images/character-main/${id}_${suffix}.jpg`
	}
</script>

<div class="rep">
	<ul class="characters">
		<li class={`protagonist ${protagonistClass}`} class:empty={!protagonistClass}></li>
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
	@use '$src/themes/rep' as rep;

	.rep {
		width: 100%;
		height: 100%;
		border-radius: $item-corner-small;
		grid-gap: $unit-half;

		.characters {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			gap: $unit-half;
			margin: 0;
			padding: 0;
			list-style: none;

			.character,
			.protagonist {
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
			}

			.character img {
				display: block;
				width: 100%;
				height: 100%;
				object-fit: cover;
			}
		}

		.protagonist {
			border-color: transparent;
			border-width: 1px;
			border-style: solid;
			@include rep.aspect(32, 66);

			img {
				position: relative;
				width: 100%;
				height: 100%;
			}

			&.wind {
				background: var(--wind-portrait-bg);
				border-color: var(--wind-bg);
			}

			&.fire {
				background: var(--fire-portrait-bg);
				border-color: var(--fire-bg);
			}

			&.water {
				background: var(--water-portrait-bg);
				border-color: var(--water-bg);
			}

			&.earth {
				background: var(--earth-portrait-bg);
				border-color: var(--earth-bg);
			}

			&.light {
				background: var(--light-portrait-bg);
				border-color: var(--light-bg);
			}

			&.dark {
				background: var(--dark-portrait-bg);
				border-color: var(--dark-bg);
			}

			&.empty {
				background: var(--placeholder-bg);
				box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
			}
		}
	}
</style>
