<script lang="ts">
	import { getCharacterImage, getWeaponImage, getSummonImage, getRaidImage } from '$lib/utils/images'

	interface Props {
		id: string
		type: 'character' | 'weapon' | 'summon' | 'raid'
		image?: '01' | '02' | '03' | '04'
		name?: string
	}

	let { id, type, image = '01', name = '' }: Props = $props()

	const imageUrl = $derived.by(() => {
		switch (type) {
			case 'character':
				return getCharacterImage(id, 'grid', image)
			case 'weapon':
				return getWeaponImage(id, 'grid', undefined, image !== '01' ? image : undefined)
			case 'summon':
				return getSummonImage(id, 'grid', image !== '01' ? image : undefined)
			case 'raid':
				return getRaidImage(id, 'thumbnail')
		}
	})
</script>

<div class="unit">
	<img alt={name} src={imageUrl} />
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

		h4 {
			font-size: $font-small;
			font-weight: $medium;
			text-align: center;
			line-height: 1.4;
		}
	}
</style>
