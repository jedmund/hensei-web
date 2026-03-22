
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getWeaponImage } from '$lib/features/database/detail/image'
	import { getWeaponFallbackImage, handleImageFallback } from '$lib/utils/images'

	const { row }: Cell = $props()

	const element = $derived(row.element === 0 ? 0 : undefined)
	const fallbackUrl = $derived(
		element === 0 ? getWeaponFallbackImage(row.granblueId, 'square') : undefined
	)
</script>

<div class="image-cell">
	<img
		src={getWeaponImage(row.granblueId, 'square', element)}
		alt=""
		class="database-image"
		onerror={(e) => handleImageFallback(e, fallbackUrl)}
	/>
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;

	.image-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: spacing.$unit-half;
	}

	.database-image {
		max-width: 100%;
		max-height: 60px;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}
</style>