<svelte:options runes={true} />

<script lang="ts">
	import type { Raid } from '$lib/types/api/entities'
	import { getRaidImage, getRaidCdnImage } from '$lib/utils/images'

	interface Props {
		raid: Raid
	}

	const { raid }: Props = $props()

	// Prefer local icon image, fallback to CDN
	const iconUrl = $derived.by(() => {
		if (raid.slug) return getRaidImage(raid.slug, 'icon')
		if (raid.enemy_id) return getRaidCdnImage('icon', raid.enemy_id)
		return ''
	})
</script>

<div class="image-cell">
	{#if iconUrl}
		<img src={iconUrl} alt="" class="database-image" />
	{:else}
		<div class="no-image"></div>
	{/if}
</div>

<style lang="scss">
	.image-cell {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 4px;
	}

	.database-image {
		max-width: 100%;
		max-height: 48px;
		width: auto;
		height: auto;
		object-fit: contain;
		border-radius: 4px;
	}

	.no-image {
		width: 48px;
		height: 48px;
		background: #f0f0f0;
		border-radius: 4px;
	}
</style>
