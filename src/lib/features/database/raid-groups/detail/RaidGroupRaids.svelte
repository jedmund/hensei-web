<script lang="ts">
	// The group's raids, each linking to its page; titled with their count.
	// Draws its own container (the section's `container: false`).
	import * as m from '$lib/paraglide/messages'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import { localizeHref } from '$lib/paraglide/runtime'
	import { localizedName } from '$lib/utils/locale'
	import type { RaidGroupFull } from '$lib/types/api/raid'

	let { record }: { record: RaidGroupFull } = $props()

	const raids = $derived(record.raids ?? [])
</script>

{#if raids.length}
	<DetailsContainer title={m.db_raid_groups_section_raids_count({ count: String(raids.length) })}>
		<div class="raids">
			{#each raids as raid (raid.id)}
				<a class="raid" href={localizeHref(`/database/raids/${raid.slug}`)}>
					<span class="name">{localizedName(raid.name)}</span>
					<span class="level">
						{m.db_raid_groups_raid_level({ level: raid.level?.toString() ?? '—' })}
					</span>
				</a>
			{/each}
		</div>
	</DetailsContainer>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.raids {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		width: 100%;
	}

	.raid {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--table-header-bg);
		border: 1px solid var(--table-border);
		border-radius: layout.$item-corner;
		color: var(--text-primary);
		text-decoration: none;

		&:hover {
			background: var(--table-row-hover);
		}
	}

	.name {
		font-weight: typography.$bold;
	}

	.level {
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}
</style>
