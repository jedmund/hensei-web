<script lang="ts">
	import type { Party, GridWeapon, GridCharacter } from '$lib/types/api/party'
	import type { Job } from '$lib/types/api/entities'
	import { getElementClass } from '$lib/utils/element'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import { getJobPortraitUrl, Gender } from '$lib/utils/jobUtils'

	interface Props {
		party?: Party
		characters?: GridCharacter[]
		job?: Job
		jobId?: string
		element?: number
		gender?: number
	}

	let { party, characters: directCharacters, job, jobId, element, gender }: Props = $props()

	// Use direct characters if provided, otherwise get from party
	const characters = $derived(directCharacters || party?.characters || [])
	const grid = $derived(Array.from({ length: 3 }, (_, i) =>
		characters.find((c: GridCharacter) => c?.position === i)
	))

	// Get job from party if not directly provided
	const currentJob = $derived(job || party?.job)
	const genderValue = $derived(gender !== undefined ? gender : 0) // Default to Gran if not specified

	const protagonistClass = $derived(
		// If element is directly provided, use it
		element ? getElementClass(element) :
		// Otherwise try to get from party's mainhand weapon
		party ? (() => {
			const main: GridWeapon | undefined = (party.weapons || []).find(
				(w: GridWeapon) => w?.mainhand || w?.position === -1
			)
			const el = main?.element ?? main?.weapon?.element
			return getElementClass(el) || ''
		})() : ''
	)

	// Get job portrait URL if job is available
	const jobPortraitUrl = $derived(
		currentJob ? getJobPortraitUrl(currentJob, genderValue as Gender) : ''
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
			'main',
			c?.uncapLevel ?? 0,
			c?.transcendenceStep ?? 0,
			mainWeaponElement,
			undefined // partyElement not used here
		)
	}
</script>

<div class="rep">
	<ul class="characters">
		<li class={`protagonist ${protagonistClass}`} class:empty={!currentJob}>
			{#if currentJob && jobPortraitUrl}
				<img
					alt="{currentJob.name.en} job"
					src={jobPortraitUrl}
					loading="lazy"
					decoding="async"
				/>
			{/if}
		</li>
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
				object-fit: cover;
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
