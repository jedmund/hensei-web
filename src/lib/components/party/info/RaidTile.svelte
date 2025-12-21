<script lang="ts">
	import InfoTile from './InfoTile.svelte'
	import type { Raid } from '$lib/types/api/entities'

	interface Props {
		raid?: Raid
	}

	let { raid }: Props = $props()

	const raidName = $derived(() => {
		if (!raid) return null
		if (typeof raid.name === 'string') return raid.name
		return raid.name?.en || raid.name?.ja || 'Unknown Raid'
	})
</script>

<InfoTile label="Raid" class="raid-tile">
	{#if raid}
		<div class="raid-info">
			<span class="raid-name">{raidName()}</span>
			{#if raid.group?.difficulty}
				<span class="raid-difficulty">Lv. {raid.group.difficulty}</span>
			{/if}
		</div>
	{:else}
		<span class="empty-state">No raid selected</span>
	{/if}
</InfoTile>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.raid-info {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
	}

	.raid-name {
		font-size: $font-medium;
		font-weight: $bold;
		color: var(--text-primary);
	}

	.raid-difficulty {
		font-size: $font-regular;
		color: var(--text-secondary);
	}

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
