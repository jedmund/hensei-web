<script lang="ts">
	import InfoTile from './InfoTile.svelte'
	import type { Raid } from '$lib/types/api/entities'
	import { getRaidImage } from '$lib/utils/images'
	import { getElementLabel } from '$lib/utils/element'

	interface Props {
		raid?: Raid
	}

	let { raid }: Props = $props()

	const raidName = $derived(() => {
		if (!raid) return null
		if (typeof raid.name === 'string') return raid.name
		return raid.name?.en || raid.name?.ja || 'Unknown Raid'
	})

	const elementLabel = $derived(raid ? getElementLabel(raid.element) : null)
</script>

<InfoTile label="Raid" class="raid-tile">
	{#if raid}
		<div class="raid-info">
			<img src={getRaidImage(raid.slug)} alt="" class="raid-image" />
			<div class="raid-details">
				<span class="raid-name">{raidName()}</span>
				<span class="raid-meta">Lv. {raid.level} · {elementLabel}</span>
			</div>
		</div>
	{:else}
		<span class="empty-state">No raid selected</span>
	{/if}
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.raid-info {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.raid-image {
		height: 48px;
		width: auto;
		border-radius: $item-corner;
	}

	.raid-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.raid-name {
		font-size: $font-small;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.raid-meta {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
