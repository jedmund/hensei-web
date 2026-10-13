<script lang="ts">
	import { toast } from 'svelte-sonner'
	import {
		solomonisExpedition,
		useReplaceGuidebook
	} from '$lib/api/mutations/solomonis-guidebook.mutations'
	import { extractErrorMessage } from '$lib/utils/errors'
	import * as m from '$lib/paraglide/messages'
	import type { Party } from '$lib/types/api/party'
	import type { GuideEffect, GuidebookEntry } from '$lib/types/api/solomonis'
	import Button from '$lib/components/ui/Button.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import GuideEffectItem from './GuideEffectItem.svelte'
	import {
		addEffect,
		groupByRarity,
		hasAcquiredOrder,
		removeEntry,
		sortByAcquiredOrder,
		updateEntry,
		type GuidebookEntryPatch
	} from './guidebook'
	import { rarityLabel } from './labels'
	import { openGuideEffectSearchSidebar, openGuidebookEntrySidebar } from './openGuidebookSidebar'

	interface Props {
		/** The full party view. Renders nothing unless it's a Solomonis run. */
		party: Party
		canEdit?: boolean
	}

	let { party, canEdit = false }: Props = $props()

	const expedition = $derived(solomonisExpedition(party))
	const isRun = $derived(expedition?.kind === 'run')

	// Edits made while a save is in flight build on each other, not on the
	// (possibly older) list in the party prop.
	let pendingEntries = $state<GuidebookEntry[] | null>(null)
	let inFlight = 0

	const entries = $derived(pendingEntries ?? expedition?.guidebook ?? [])
	const groups = $derived(groupByRarity(entries))
	const canShowPickupOrder = $derived(hasAcquiredOrder(entries))

	let orderMode = $state<string>('rarity')
	const showPickupOrder = $derived(canShowPickupOrder && orderMode === 'pickup')
	const pickupOrdered = $derived(sortByAcquiredOrder(entries))

	const replaceGuidebook = useReplaceGuidebook()

	function save(next: GuidebookEntry[]) {
		if (next === entries) return
		pendingEntries = next
		inFlight += 1
		replaceGuidebook.mutate(
			{ partyId: party.id, shortcode: party.shortcode, entries: next },
			{
				onError: (err) => {
					toast.error(extractErrorMessage(err, m.solomonis_web_guidebook_save_failed()))
				},
				onSettled: () => {
					inFlight -= 1
					if (inFlight === 0) pendingEntries = null
				}
			}
		)
	}

	function handleAdd() {
		openGuideEffectSearchSidebar({
			entries: () => entries,
			onSelect: (effect: GuideEffect) => save(addEffect(entries, effect))
		})
	}

	function handleEdit(entry: GuidebookEntry) {
		const effectId = entry.effect.id
		openGuidebookEntrySidebar({
			entry,
			onSave: (patch: GuidebookEntryPatch) => save(updateEntry(entries, effectId, patch)),
			onRemove: () => save(removeEntry(entries, effectId))
		})
	}
</script>

{#if expedition && isRun}
	<section class="solomonis-guidebook">
		<header class="header">
			<div class="title">
				<h3>{m.solomonis_web_guidebook_title()}</h3>
				{#if entries.length > 0}
					<span class="summary">
						{m.solomonis_web_guidebook_effect_count({ count: entries.length })}
					</span>
				{/if}
			</div>
			<div class="actions">
				{#if canShowPickupOrder}
					<SegmentedControl bind:value={orderMode} size="xsmall" variant="background">
						<Segment value="rarity">{m.solomonis_web_guidebook_order_rarity()}</Segment>
						<Segment value="pickup">{m.solomonis_web_guidebook_order_pickup()}</Segment>
					</SegmentedControl>
				{/if}
				{#if canEdit}
					<Button size="small" leftIcon="plus" onclick={handleAdd}>
						{m.solomonis_web_guidebook_add()}
					</Button>
				{/if}
			</div>
		</header>

		{#if entries.length === 0}
			<p class="empty">{m.solomonis_web_guidebook_empty()}</p>
		{:else if showPickupOrder}
			<ul class="effects">
				{#each pickupOrdered as entry (entry.effect.id)}
					<li>
						<GuideEffectItem
							{entry}
							order={entry.acquiredOrder}
							onclick={canEdit ? () => handleEdit(entry) : undefined}
						/>
					</li>
				{/each}
			</ul>
		{:else}
			{#each groups as group (group.rarity)}
				<div class="group {group.rarity}">
					<h4 class="group-title">{rarityLabel(group.rarity)}</h4>
					<ul class="effects">
						{#each group.entries as entry (entry.effect.id)}
							<li>
								<GuideEffectItem {entry} onclick={canEdit ? () => handleEdit(entry) : undefined} />
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		{/if}
	</section>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.solomonis-guidebook {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.header {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	.title {
		display: flex;
		align-items: baseline;
		gap: $unit;

		// Matches DetailsSection headings in the details pane
		h3 {
			margin: 0;
			font-size: $font-name;
			font-weight: $medium;
			color: var(--text-primary);
		}
	}

	.summary {
		font-size: $font-small;
		color: var(--text-secondary);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: $unit;
	}

	.empty {
		margin: 0;
		font-size: $font-small;
		color: var(--text-tertiary);
	}

	.group {
		display: flex;
		flex-direction: column;
		gap: $unit;
	}

	.group-title {
		margin: 0;
		font-size: $font-small;
		font-weight: $bold;
		color: var(--text-secondary);
	}

	.group.cursed .group-title {
		color: var(--danger);
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
