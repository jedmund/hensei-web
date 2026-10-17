<script lang="ts">
	/**
	 * Shared fields for the event new + review pages: names, kind, element,
	 * JST start and end times, and raid links (picked with the raid pane).
	 */
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { localizedName } from '$lib/utils/locale'
	import {
		eventKindNeedsElement,
		eventKindOptions,
		type EventFormState
	} from '$lib/utils/eventLabels'
	import type { RaidFull } from '$lib/types/api/raid'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		values: EventFormState
		/** Unite and Fight number, read-only (comes from the sync) */
		eventNumber?: number | null | undefined
	}

	let { values = $bindable(), eventNumber }: Props = $props()

	const kindOptions = $derived(eventKindOptions())
	const needsElement = $derived(eventKindNeedsElement(values.kind))

	function addRaid() {
		sidebar.openWithComponent(
			m.pane_select_raid(),
			EditRaidPane,
			{
				currentRaid: null,
				onSelect: (raid: RaidFull | null) => {
					sidebar.close()
					if (raid && !values.raids.some((r) => r.id === raid.id)) {
						values.raids = [...values.raids, raid]
					}
				}
			},
			{ scrollable: true }
		)
	}

	function removeRaid(id: string) {
		values.raids = values.raids.filter((r) => r.id !== id)
	}
</script>

<DetailsContainer title={m.db_events_section_details()}>
	<DetailItem
		label={m.db_events_field_name_en()}
		bind:value={values.nameEn}
		editable={true}
		type="text"
	/>
	<DetailItem
		label={m.db_events_field_name_jp()}
		bind:value={values.nameJp}
		editable={true}
		type="text"
	/>
	<DetailItem
		label={m.db_events_field_kind()}
		bind:value={values.kind}
		editable={true}
		type="select"
		options={kindOptions}
	/>
	<DetailItem
		label={m.db_events_field_element()}
		sublabel={needsElement ? m.db_events_element_required() : undefined}
		editable={true}
	>
		<ElementPicker bind:value={values.element} mode="dropdown" includeAny contained />
	</DetailItem>
	{#if values.kind === 'unite_and_fight' && eventNumber}
		<DetailItem label={m.db_events_field_number()} value={eventNumber} />
	{/if}
	<DetailItem label={m.db_events_field_starts_at()} editable={true}>
		<Input type="datetime-local" bind:value={values.startsAt} contained />
	</DetailItem>
	<DetailItem label={m.db_events_field_ends_at()} editable={true}>
		<Input type="datetime-local" bind:value={values.endsAt} contained />
	</DetailItem>
</DetailsContainer>

<DetailsContainer title={m.db_events_section_raids()}>
	<div class="raids">
		{#if values.raids.length === 0}
			<p class="hint">{m.db_events_raids_empty()}</p>
		{:else}
			<ul class="raid-list">
				{#each values.raids as raid (raid.id)}
					<li>
						<span>{localizedName(raid.name)}</span>
						<Button variant="ghost" size="small" onclick={() => removeRaid(raid.id)}>
							{m.db_events_raid_remove()}
						</Button>
					</li>
				{/each}
			</ul>
		{/if}
		<Button variant="secondary" size="small" onclick={addRaid}>{m.db_events_raid_add()}</Button>
	</div>
</DetailsContainer>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.raids {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: spacing.$unit;
		padding: spacing.$unit-2x;
	}

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
			justify-content: space-between;
			padding: spacing.$unit-half spacing.$unit;
			background: var(--input-bound-bg);
			border-radius: layout.$item-corner;
		}
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
