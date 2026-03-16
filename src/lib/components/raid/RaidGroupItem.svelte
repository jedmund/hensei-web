<script lang="ts">
	/**
	 * RaidGroupItem - Displays a single raid group with header and its raids
	 *
	 * Shows the group name as a header and lists all raids underneath.
	 * Each raid shows an icon, name, level, and selected state.
	 */
	import type { RaidGroupFull, RaidFull } from '$lib/types/api/raid'
	import { getRaidImage } from '$lib/utils/images'
	import Icon from '$lib/components/Icon.svelte'
	import { localizedName } from '$lib/utils/locale'

	interface Props {
		group: RaidGroupFull
		selectedRaidId?: string
		onSelect: (raid: RaidFull) => void
	}

	let { group, selectedRaidId, onSelect }: Props = $props()

	// Sort raids by element, then by level as tiebreaker
	const sortedRaids = $derived(
		[...group.raids].sort((a, b) => {
			const elementDiff = (a.element ?? 0) - (b.element ?? 0)
			if (elementDiff !== 0) return elementDiff
			return (a.level ?? 0) - (b.level ?? 0)
		})
	)

	function getRaidName(raid: RaidFull): string {
		return localizedName(raid.name)
	}

	function getGroupName(group: RaidGroupFull): string {
		return localizedName(group.name)
	}
</script>

<div class="raid-group">
	<div class="group-header">
		<span class="group-name">{getGroupName(group)}</span>
		{#if group.extra}
			<span class="ex-badge">EX</span>
		{/if}
	</div>

	<div class="raid-list">
		{#each sortedRaids as raid (raid.id)}
			{@const isSelected = raid.id === selectedRaidId}
			<button
				type="button"
				class="raid-item"
				class:selected={isSelected}
				onclick={() => onSelect(raid)}
			>
				<img src={getRaidImage(raid.slug)} alt="" class="raid-icon" />
				<div class="raid-info">
					<span class="raid-name">{getRaidName(raid)}</span>
					{#if raid.level}
						<span class="raid-level">Lv. {raid.level}</span>
					{/if}
				</div>
				{#if isSelected}
					<Icon name="check" size={16} class="check-icon" />
				{/if}
			</button>
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/colors' as *;

	.raid-group {
		display: flex;
		flex-direction: column;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit $unit-2x;
		background: var(--input-bg);
		position: sticky;
		top: 0;
		z-index: $z-raised;
	}

	.group-name {
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-secondary);
	}

	.ex-badge {
		font-size: $font-tiny;
		font-weight: $bold;
		color: $light-text-30;
		background: rgba($light-bg-10, 0.2);
		padding: 1px 4px;
		border-radius: 3px;
	}

	.raid-list {
		display: flex;
		flex-direction: column;
		padding: $unit;
	}

	.raid-item {
		display: flex;
		align-items: center;
		gap: $unit-2x;
		padding: $unit $unit-2x $unit $unit;
		background: transparent;
		border: none;
		border-radius: $card-corner;
		cursor: pointer;
		text-align: left;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--button-bg);
		}

		&.selected {
			background: var(--button-bg);
		}
	}

	.raid-icon {
		height: 60px;
		width: auto;
		border-radius: $item-corner;
		flex-shrink: 0;
	}

	.raid-info {
		display: flex;
		flex-direction: column;
		gap: $unit-fourth;
		flex: 1;
		min-width: 0;
	}

	.raid-name {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.raid-level {
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	:global(.check-icon) {
		color: var(--text-secondary);
		flex-shrink: 0;
	}
</style>
