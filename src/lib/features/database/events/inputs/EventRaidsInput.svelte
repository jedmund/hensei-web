<script lang="ts">
	// The event's raids on the forms: the value is their ids in order, picked
	// with the raid pane. Raids already linked, and those picked here, are
	// kept by id so the list can show them.
	import { untrack } from 'svelte'
	import { SvelteMap } from 'svelte/reactivity'
	import * as m from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import type { GameEvent } from '$lib/types/api/event'
	import type { RaidFull } from '$lib/types/api/raid'
	import EventRaidList from '../detail/EventRaidList.svelte'

	let { field, form, record }: InputProps = $props()

	const known = new SvelteMap<string, RaidFull>(
		untrack(() => ((record as GameEvent | null)?.raids ?? []).map((r) => [r.id, r]))
	)

	const ids = $derived((form.values[field.key] ?? []) as string[])
	const raids = $derived(ids.flatMap((id) => known.get(id) ?? []))
	const error = $derived(form.error(field.key))

	function add() {
		sidebar.openWithComponent(
			m.pane_select_raid(),
			EditRaidPane,
			{
				currentRaid: null,
				onSelect: (raid: RaidFull | null) => {
					sidebar.close()
					if (!raid || ids.includes(raid.id)) return
					known.set(raid.id, raid)
					form.set(field.key, [...ids, raid.id])
				}
			},
			{ scrollable: true }
		)
	}

	function remove(id: string) {
		form.set(
			field.key,
			ids.filter((i) => i !== id)
		)
	}
</script>

<div class="event-raids">
	<EventRaidList {raids} onRemove={remove} />
	{#if error}
		<p class="error">{error}</p>
	{/if}
	<div>
		<Button variant="secondary" size="small" onclick={add}>{m.db_events_raid_add()}</Button>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.event-raids {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		width: 100%;
	}

	.error {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-error, #ef4444);
	}
</style>
