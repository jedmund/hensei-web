<script lang="ts">
	import InfoTile from './InfoTile.svelte'
	import type { Raid } from '$lib/types/api/entities'
	import { getRaidImage } from '$lib/utils/images'
	import { getElementLabel } from '$lib/utils/element'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		raid?: Raid
		onclick?: () => void
	}

	let { raid, onclick }: Props = $props()

	// Only clickable if raid exists and onclick is provided
	const clickable = $derived(!!raid && !!onclick)

	const raidName = $derived(() => {
		if (!raid) return null
		return localizedName(raid.name)
	})

	const elementLabel = $derived(raid ? getElementLabel(raid.element) : null)
</script>

<InfoTile label={m.party_raid_label()} class="raid-tile" {clickable} {onclick}>
	{#if raid}
		<div class="raid-info">
			<img src={getRaidImage(raid.slug)} alt="" class="raid-image" />
			<div class="raid-details">
				<span class="raid-name">{raidName()}</span>
				<span class="raid-meta">Lv. {raid.level} · {elementLabel}</span>
			</div>
		</div>
	{:else}
		<span class="empty-state">{m.party_raid_empty()}</span>
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
		gap: $unit-fourth;
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
