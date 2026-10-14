<script lang="ts">
	/**
	 * GuidebookGroup - one rarity's guidebook effects, a collapsible
	 * section of GuidebookSection's accordion.
	 */
	import { Accordion } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import type { GuidebookEntry } from '$lib/types/api/solomonis'
	import GuidebookRow from './GuidebookRow.svelte'
	import type { RarityGroup } from './guidebook'
	import { rarityLabel } from './labels'

	interface Props {
		group: RarityGroup
		/** Opens an entry for editing; rows are static without it. */
		onEdit?: ((entry: GuidebookEntry) => void) | undefined
	}

	let { group, onEdit }: Props = $props()
</script>

<Accordion.Item value={group.rarity} class="guidebook-group {group.rarity}">
	<Accordion.Header level={4} class="group-header">
		<Accordion.Trigger class="group-trigger">
			<span class="group-title">{rarityLabel(group.rarity)}</span>
			<span class="group-count">{group.entries.length}</span>
			<Icon name="chevron-down-small" size={14} class="group-chevron" />
		</Accordion.Trigger>
	</Accordion.Header>
	<Accordion.Content class="group-content">
		<ul class="effects">
			{#each group.entries as entry (entry.effect.id)}
				<li>
					<GuidebookRow {entry} onclick={onEdit ? () => onEdit(entry) : undefined} />
				</li>
			{/each}
		</ul>
	</Accordion.Content>
</Accordion.Item>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	:global(.guidebook-group .group-header) {
		margin: 0;
	}

	// Full-width header; a rounded grey rect on hover
	:global(.guidebook-group .group-trigger) {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		margin: 0 (-$unit);
		width: calc(100% + #{$unit-2x});
		border: none;
		border-radius: $item-corner;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--list-cell-bg-hover);
		}

		&:focus-visible {
			outline: 2px solid var(--focus-ring);
			outline-offset: 1px;
		}
	}

	.group-title {
		font-size: $font-small;
		font-weight: $bold;
		color: var(--text-secondary);
	}

	.group-count {
		flex: 1;
		font-size: $font-small;
		color: var(--text-tertiary);
		font-variant-numeric: tabular-nums;
	}

	:global(.guidebook-group .group-chevron) {
		color: var(--icon-secondary);
		@include smooth-transition($duration-quick, transform);
	}

	:global(.guidebook-group .group-trigger[data-state='closed'] .group-chevron) {
		transform: rotate(-90deg);
	}

	:global(.guidebook-group.cursed) .group-title {
		color: var(--danger);
	}

	:global(.guidebook-group .group-content) {
		padding-top: $unit-half;
	}

	.effects {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
		gap: $unit;
		margin: 0;
		padding: 0;
		list-style: none;
	}
</style>
