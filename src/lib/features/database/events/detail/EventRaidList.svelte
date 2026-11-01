<script lang="ts">
	// An event's raids in order, each with its thumbnail; a remove button on
	// each when `onRemove` is given (the forms)
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import { getRaidImage } from '$lib/utils/images/raids'
	import { localizedName } from '$lib/utils/locale'
	import type { RaidFull } from '$lib/types/api/raid'

	interface Props {
		raids: Pick<RaidFull, 'id' | 'slug' | 'name'>[]
		onRemove?: (id: string) => void
	}

	let { raids, onRemove }: Props = $props()
</script>

{#if raids.length === 0}
	<p class="hint">{m.db_events_raids_empty()}</p>
{:else}
	<ul class="raid-list">
		{#each raids as raid (raid.id)}
			<li>
				<img src={getRaidImage(raid.slug)} alt="" class="thumb" />
				<span class="name">{localizedName(raid.name)}</span>
				{#if onRemove}
					<Button variant="ghost" size="small" onclick={() => onRemove(raid.id)}>
						{m.db_events_raid_remove()}
					</Button>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.raid-list {
		list-style: none;
		margin: 0;
		padding: 0;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;

		li {
			display: flex;
			align-items: center;
			gap: spacing.$unit;
			padding: spacing.$unit-half spacing.$unit;
			padding-left: spacing.$unit-half;
			background: var(--input-bound-bg);
			border-radius: layout.$item-corner;
			color: var(--text-primary);
		}
	}

	.thumb {
		height: spacing.$unit * 5;
		width: auto;
		border-radius: layout.$item-corner-small;
	}

	.name {
		flex: 1;
		min-width: 0;
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
