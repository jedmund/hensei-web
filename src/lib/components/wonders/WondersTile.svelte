<script lang="ts">
	/**
	 * WondersTile - the team's Wonders row: the Wonders that apply to the
	 * team (its element; no Seals on Unite and Fight teams), each with its
	 * level or bonus. Opens the details pane; editors can edit the set.
	 * Renders nothing until the catalogue is in, and nothing for viewers
	 * when no Wonder applies.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import { m } from '$lib/paraglide/messages'
	import InfoTile from '$lib/components/party/info/InfoTile.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import WonderCard from './WonderCard.svelte'
	import { wonderQueries } from '$lib/api/queries/wonder.queries'
	import { visiblePartyWonders } from '$lib/features/wonders/wonders'
	import { openEditWondersPane, openPartyWondersPane } from './openPartyWonderPanes'
	import type { Party } from '$lib/types/api/party'

	interface Props {
		party: Party
		canEdit: boolean
	}

	let { party, canEdit }: Props = $props()

	const catalogueQuery = createQuery(() => wonderQueries.catalogue())

	const visible = $derived(
		catalogueQuery.data ? visiblePartyWonders(party, catalogueQuery.data) : []
	)
	// A team that isn't saved yet has nowhere to write Wonders to
	const canWrite = $derived(canEdit && party.id !== 'new')
	const show = $derived(!!catalogueQuery.data && (visible.length > 0 || canWrite))

	function openDetails() {
		openPartyWondersPane(() => party, canEdit)
	}

	function openEdit() {
		openEditWondersPane(() => party)
	}
</script>

{#if show}
	<InfoTile label={m.wonders_title()} showAdd={canWrite && visible.length === 0} onAdd={openEdit}>
		{#snippet headerAction()}
			{#if visible.length > 0}
				<div class="header-actions">
					<Button variant="ghost" size="small" onclick={openDetails}>
						{m.context_view_details()}
					</Button>
					{#if canWrite}
						<Button variant="ghost" size="small" onclick={openEdit}>{m.action_edit()}</Button>
					{/if}
				</div>
			{/if}
		{/snippet}
		{#if visible.length > 0}
			<div class="wonder-row">
				{#each visible as { wonder, row } (row.id)}
					<WonderCard {wonder} {row} size={60} showName={false} onclick={openDetails} />
				{/each}
			</div>
		{:else}
			<span class="empty-state">{m.wonders_party_add()}</span>
		{/if}
	</InfoTile>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.header-actions {
		display: flex;
		align-items: center;
	}

	.wonder-row {
		display: flex;
		flex-wrap: wrap;
		gap: $unit $unit-2x;
		padding-top: $unit-half;
	}

	.empty-state {
		font-size: $font-regular;
		color: var(--text-tertiary);
	}
</style>
