<script lang="ts">
	/**
	 * Shared fields for the event new + review pages: names, kind, element,
	 * the Unite and Fight number, JST start and end times, and raid links
	 * (picked with the raid pane).
	 * `readonly` shows the same fields as text, for curators.
	 */
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import EditRaidPane from '$lib/components/sidebar/EditRaidPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { getRaidImage } from '$lib/utils/images/raids'
	import {
		eventKindLabel,
		eventKindNeedsElement,
		eventKindOptions,
		eventSeriesOptions,
		type EventFormState
	} from '$lib/utils/eventLabels'
	import type { RaidFull } from '$lib/types/api/raid'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		values: EventFormState
		/** Show the values without controls */
		readonly?: boolean | undefined
	}

	let { values = $bindable(), readonly = false }: Props = $props()

	const kindOptions = $derived(eventKindOptions())
	const seriesOptions = $derived(eventSeriesOptions())
	const seriesLabel = $derived(
		seriesOptions.find((o) => o.value === values.series)?.label ?? m.event_series_none()
	)
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
	{#if readonly}
		<DetailItem label={m.db_events_field_name_en()} value={values.nameEn} />
		<DetailItem label={m.db_events_field_name_jp()} value={values.nameJp} />
		<DetailItem label={m.db_events_field_kind()} value={eventKindLabel(values.kind)} />
		<DetailItem label={m.db_events_field_series()} value={seriesLabel} />
		<DetailItem label={m.db_events_field_element()}>
			{#if values.element}
				<ElementBadge element={values.element} />
			{:else}
				—
			{/if}
		</DetailItem>
	{:else}
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
			label={m.db_events_field_series()}
			sublabel={m.db_events_series_hint()}
			bind:value={values.series}
			editable={true}
			type="select"
			options={seriesOptions}
		/>
		<DetailItem
			label={m.db_events_field_element()}
			sublabel={needsElement ? m.db_events_element_required() : undefined}
			editable={true}
		>
			<ElementPicker bind:value={values.element} mode="dropdown" includeAny contained />
		</DetailItem>
	{/if}
	{#if values.kind === 'unite_and_fight'}
		{#if readonly}
			<!-- The number is editor-only in the API, so curators usually have none -->
			{#if values.eventNumber > 0}
				<DetailItem label={m.db_events_field_number()} value={values.eventNumber} />
			{/if}
		{:else}
			<DetailItem
				label={m.db_events_field_number()}
				bind:value={values.eventNumber}
				editable={true}
				type="number"
				min={1}
			/>
		{/if}
	{/if}
	{#if readonly}
		<DetailItem
			label={m.db_events_field_starts_at()}
			value={values.startsAt.replace(/-/g, '/').replace('T', ' ')}
		/>
		<DetailItem
			label={m.db_events_field_ends_at()}
			value={values.endsAt.replace(/-/g, '/').replace('T', ' ')}
		/>
	{:else}
		<DetailItem label={m.db_events_field_starts_at()} editable={true}>
			<Input type="datetime-local" bind:value={values.startsAt} contained />
		</DetailItem>
		<DetailItem label={m.db_events_field_ends_at()} editable={true}>
			<Input type="datetime-local" bind:value={values.endsAt} contained />
		</DetailItem>
	{/if}
</DetailsContainer>

<DetailsContainer title={m.db_events_section_raids()}>
	{#snippet action()}
		{#if !readonly}
			<Button variant="secondary" size="small" onclick={addRaid}>{m.db_events_raid_add()}</Button>
		{/if}
	{/snippet}
	{#if values.raids.length === 0}
		<p class="hint">{m.db_events_raids_empty()}</p>
	{:else}
		<ul class="raid-list">
			{#each values.raids as raid (raid.id)}
				<li>
					<img src={getRaidImage(raid.slug)} alt="" class="thumb" />
					<span class="name">{localizedName(raid.name)}</span>
					{#if !readonly}
						<Button variant="ghost" size="small" onclick={() => removeRaid(raid.id)}>
							{m.db_events_raid_remove()}
						</Button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</DetailsContainer>

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
