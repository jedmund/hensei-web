<script lang="ts">
	// The event's raids on the forms: the value is their ids in order, picked
	// with the raid pane in multi-select (each click adds or removes a raid,
	// added ones go last). Raids already linked, and those picked here, are
	// kept by id so the list can show them. Beside each raid, the day it opens
	// on (the raid_unlock_days field); left blank on a newly linked raid, the
	// API fills in its scheduled day.
	import { untrack } from 'svelte'
	import { SvelteMap } from 'svelte/reactivity'
	import { m } from '$lib/paraglide/messages'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Input.svelte'
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

	const DAYS_KEY = 'raid_unlock_days'
	const days = $derived((form.values[DAYS_KEY] ?? {}) as Record<string, number | null>)
	const daysError = $derived(form.error(DAYS_KEY))

	function setDay(id: string, value: unknown) {
		const day = value === '' || value === null || value === undefined ? null : Number(value)
		form.set(DAYS_KEY, { ...days, [id]: Number.isFinite(day) ? day : null })
	}

	function toggle(raid: RaidFull | null) {
		if (!raid) return
		if (ids.includes(raid.id)) {
			remove(raid.id)
			return
		}
		known.set(raid.id, raid)
		form.set(field.key, [...ids, raid.id])
	}

	function add() {
		sidebar.openWithComponent(
			m.pane_select_raids(),
			EditRaidPane,
			{
				currentRaid: null,
				multiple: true,
				// Read live, so the pane's checks follow the form
				isSelected: (raid: RaidFull) => ids.includes(raid.id),
				onSelect: toggle
			},
			{ scrollable: true, onsave: () => sidebar.close(), saveLabel: m.action_done() }
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
	<EventRaidList {raids} onRemove={remove}>
		{#snippet dayInput(id: string)}
			<span class="day">
				<Input
					type="number"
					variant="number"
					contained
					alignRight
					min={1}
					step={1}
					placeholder="—"
					aria-label={m.db_events_raid_unlock_day()}
					bind:value={() => days[id] ?? '', (v) => setDay(id, v)}
				/>
			</span>
		{/snippet}
	</EventRaidList>
	<p class="hint">{m.db_events_raid_unlock_day_hint()}</p>
	{#each [error, daysError].filter(Boolean) as message (message)}
		<p class="error">{message}</p>
	{/each}
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

	.day {
		:global(input) {
			width: spacing.$unit * 8;
		}
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.error {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-error, #ef4444);
	}
</style>
