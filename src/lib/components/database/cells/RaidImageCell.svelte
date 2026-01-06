<svelte:options runes={true} />

<script lang="ts">
	import type { Raid } from '$lib/types/api/entities'

	const ICON_BASE_URL = 'https://prd-game-a-granbluefantasy.akamaized.net/assets_en/img/sp/assets/enemy/m'

	interface Props {
		raid: Raid
	}

	const { raid }: Props = $props()

	function getIconUrl(enemyId: number): string {
		return `${ICON_BASE_URL}/${enemyId}.png`
	}
</script>

<div class="image-cell">
	{#if raid.enemy_id}
		<img src={getIconUrl(raid.enemy_id)} alt="" class="database-image" />
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
