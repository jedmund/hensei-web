<script lang="ts">
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import type { RosterMember, RosterItem } from '$lib/types/api/crew'
	import * as m from '$lib/paraglide/messages'

	type ItemType = 'Character' | 'Weapon' | 'Summon'

	interface SelectedItem {
		id: string
		granblueId: string
		name: string
		type: ItemType
	}

	interface Props {
		member: RosterMember
		selectedItems: SelectedItem[]
	}

	const { member, selectedItems }: Props = $props()

	function getOwnershipInfo(item: SelectedItem): RosterItem | null {
		const collection =
			item.type === 'Character'
				? member.characters
				: item.type === 'Weapon'
					? member.weapons
					: member.summons

		return collection.find((c) => c.id === item.id) || null
	}

	function getItemTypeForUncap(type: ItemType): 'character' | 'weapon' | 'summon' {
		return type.toLowerCase() as 'character' | 'weapon' | 'summon'
	}

	function getRoleLabel(role: string): string {
		switch (role) {
			case 'captain':
				return m.crew_role_captain()
			case 'vice_captain':
				return m.crew_role_vice_captain()
			default:
				return m.crew_role_member()
		}
	}
</script>

<div class="roster-row">
	<div class="member-col">
		<span class="member-name">{member.username}</span>
		{#if member.role !== 'member'}
			<span class="member-role">{getRoleLabel(member.role)}</span>
		{/if}
	</div>
	{#each selectedItems as item (item.id + item.type)}
		{@const ownership = getOwnershipInfo(item)}
		<div class="item-col ownership-cell">
			{#if ownership}
				<UncapIndicator
					type={getItemTypeForUncap(item.type)}
					uncapLevel={ownership.uncapLevel}
					transcendenceStage={ownership.transcendenceStep}
					flb={ownership.flb}
					ulb={ownership.ulb}
					transcendence={ownership.transcendence}
					special={item.type === 'Character' ? ownership.special : undefined}
					size="small"
					contained
				/>
			{:else}
				<span class="not-owned">N/A</span>
			{/if}
		</div>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/effects' as effects;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.roster-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x spacing.$unit 0;
		border-radius: layout.$card-corner;
		transition: background-color 0.1s;
		min-height: 52px;

		&:hover {
			background: var(--list-cell-bg-hover);
		}
	}

	.member-col {
		flex: 1;
		min-width: 150px;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-fourth;
		position: sticky;
		left: 0;
		padding-left: spacing.$unit-2x;
		background: var(--card-bg);
		z-index: effects.$z-raised;
		transition: background-color 0.1s;

		.member-name {
			font-weight: typography.$medium;
			color: var(--text-primary);
		}

		.member-role {
			font-size: typography.$font-small;
			color: var(--text-tertiary);
		}
	}

	.roster-row:hover .member-col {
		background: var(--list-cell-bg-hover);
	}

	.item-col {
		width: 70px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.ownership-cell {
		.not-owned {
			color: var(--text-tertiary);
			font-size: typography.$font-small;
			font-weight: typography.$medium;
		}
	}
</style>
