<script lang="ts">
	import Icon from '$lib/components/Icon.svelte'
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import RosterRow from '$lib/components/crew/RosterRow.svelte'
	import {
		getRosterItemImage,
		type RosterItemType,
		type SelectedRosterItem
	} from '$lib/features/crew/rosterItems'
	import type { RosterMember } from '$lib/types/api/crew'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		items: SelectedRosterItem[]
		members: RosterMember[]
		/** Officers can take items off the roster */
		canEdit: boolean
		onRemove: (id: string, type: RosterItemType) => void
	}

	const { items, members, canEdit, onRemove }: Props = $props()
</script>

<div class="roster-grid">
	<div class="roster-header">
		<div class="member-col"></div>
		{#each items as item (item.id + item.type)}
			<div class="item-col">
				<RichTooltip>
					{#snippet content()}
						<div class="tooltip-content">
							<span class="item-name">{item.name}</span>
							{#if item.type === 'Character'}
								<CharacterTags
									character={{
										element: item.element,
										season: item.season
									}}
								/>
							{/if}
						</div>
					{/snippet}
					<div class="header-item-wrapper">
						<img src={getRosterItemImage(item)} alt={item.name} class="header-item-image" />
						{#if canEdit}
							<button
								class="remove-item-btn"
								onclick={() => onRemove(item.id, item.type)}
								aria-label={m.crew_roster_remove_aria({ name: item.name })}
							>
								<Icon name="close" size={12} />
							</button>
						{/if}
					</div>
				</RichTooltip>
			</div>
		{/each}
	</div>
	<div class="roster-body">
		{#each members as member (member.userId)}
			<RosterRow {member} selectedItems={items} />
		{/each}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.roster-grid {
		overflow-x: auto;
		font-size: typography.$font-regular;
	}

	.roster-header {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x spacing.$unit 0;
	}

	.item-col {
		width: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.header-item-wrapper {
		position: relative;
	}

	.tooltip-content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.item-name {
		font-weight: typography.$medium;
	}

	.header-item-image {
		width: 60px;
		height: 60px;
		object-fit: cover;
		border-radius: layout.$item-corner-small;
	}

	.remove-item-btn {
		position: absolute;
		top: -8px;
		right: -8px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: none;
		background: var(--pill-bg);
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition:
			opacity 0.15s,
			background-color 0.15s,
			color 0.15s;

		&:hover {
			background: var(--color-red, #dc2626);
			color: white;
		}
	}

	.item-col:hover .remove-item-btn {
		opacity: 1;
	}

	.member-col {
		flex: 1;
		min-width: 150px;
		position: sticky;
		left: 0;
		padding-left: spacing.$unit-2x;
		background: var(--card-bg);
		z-index: effects.$z-raised;
	}
</style>
