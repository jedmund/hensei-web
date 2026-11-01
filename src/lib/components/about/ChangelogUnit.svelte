<script lang="ts">
	import { getCharacterImage, STYLE_SWAP_POSE } from '$lib/utils/images/characters'
	import { getWeaponImage } from '$lib/utils/images/weapons'
	import { getSummonImage } from '$lib/utils/images/summons'
	import { getAccessoryImage } from '$lib/utils/images/equipment'
	import { getRaidImage } from '$lib/utils/images/raids'
	import { getJobWideImageUrl } from '$lib/utils/jobUtils'

	interface Props {
		id: string
		type: 'character' | 'weapon' | 'summon' | 'class' | 'accessory' | 'raid'
		image?: '01' | '02' | '03' | '04'
		/** Show a character's style-shift art */
		style?: boolean
		name?: string
	}

	let { id, type, image = '01', style = false, name = '' }: Props = $props()

	// Some items have no art for the requested stage (e.g. Illustrious weapons
	// keep their base art when transcended), so fall back to the base image.
	// If that fails too, show a blank placeholder until the art is uploaded.
	let failedUrl = $state<string>()
	let missing = $state(false)

	function urlFor(variant: '01' | '02' | '03' | '04'): string {
		switch (type) {
			case 'character':
				return getCharacterImage(id, 'grid', style ? STYLE_SWAP_POSE : variant)
			case 'weapon':
				return getWeaponImage(id, 'grid', undefined, variant !== '01' ? variant : undefined)
			case 'summon':
				// 'wide' matches the weapon grid's aspect ratio
				return getSummonImage(id, 'wide', variant !== '01' ? variant : undefined)
			case 'class':
				return getJobWideImageUrl({ granblueId: id })
			case 'accessory':
				return getAccessoryImage(id, 'grid')
			case 'raid':
				return getRaidImage(id, 'thumbnail')
		}
	}

	const imageUrl = $derived.by(() => {
		const url = urlFor(image)
		return url === failedUrl ? urlFor('01') : url
	})

	function handleError() {
		if (image !== '01' && !failedUrl) failedUrl = urlFor(image)
		else missing = true
	}
</script>

<div class="unit">
	{#if missing}
		<div class="placeholder" class:raid={type === 'raid'} role="img" aria-label={name}></div>
	{:else}
		<img alt={name} src={imageUrl} onerror={handleError} />
	{/if}
	{#if name}
		<h4>{name}</h4>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.unit {
		display: flex;
		flex-direction: column;
		gap: $unit;

		img {
			border-radius: $input-corner;
			width: 100%;
		}

		// Matches the grid art (280×160) and raid thumbnails (180×126)
		.placeholder {
			aspect-ratio: 280 / 160;
			background: var(--placeholder-bg);
			border-radius: $input-corner;
			width: 100%;

			&.raid {
				aspect-ratio: 180 / 126;
			}
		}

		h4 {
			font-size: $font-small;
			font-weight: $medium;
			text-align: center;
			line-height: 1.4;
		}
	}
</style>
