<script lang="ts">
	/**
	 * Staff picks for one event: edit each pick's EN/JA note or remove it.
	 * Teams are featured from their own page (Feature this team). Notes are
	 * rendered as plain text. `readonly` lists
	 * the picks without controls (curators, once the event has ended).
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { eventQueries } from '$lib/api/queries/event.queries'
	import { useDeleteStaffPick, useUpdateStaffPick } from '$lib/api/mutations/event.mutations'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { FeaturedParty } from '$lib/types/api/featuredParty'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		eventId: string
		readonly?: boolean | undefined
	}

	let { eventId, readonly = false }: Props = $props()

	const picksQuery = createQuery(() => eventQueries.staffPicks(eventId))
	const picks = $derived([...(picksQuery.data ?? [])].sort((a, b) => a.position - b.position))

	const updateMut = useUpdateStaffPick()
	const deleteMut = useDeleteStaffPick()

	// Per-pick note drafts, keyed by pick id
	let drafts = $state<Record<string, { en: string; ja: string }>>({})
	function draftFor(pick: FeaturedParty) {
		return drafts[pick.id] ?? { en: pick.note?.en ?? '', ja: pick.note?.ja ?? '' }
	}

	function saveNote(pick: FeaturedParty) {
		const draft = draftFor(pick)
		updateMut.mutate(
			{ id: pick.id, eventId, payload: { noteEn: draft.en.trim(), noteJp: draft.ja.trim() } },
			{
				onSuccess: () => toast.success(m.db_picks_saved()),
				onError: (err) => toast.error(extractErrorMessage(err, m.db_picks_save_failed()))
			}
		)
	}

	function removePick(pick: FeaturedParty) {
		deleteMut.mutate(
			{ id: pick.id, eventId },
			{ onError: (err) => toast.error(extractErrorMessage(err, m.db_picks_save_failed())) }
		)
	}
</script>

<div class="picks">
	{#if picksQuery.isError}
		<p class="hint">{m.db_picks_load_failed()}</p>
	{:else if picks.length === 0}
		<p class="hint">{m.db_picks_empty()}</p>
	{:else}
		<ul class="pick-list">
			{#each picks as pick (pick.id)}
				{@const draft = draftFor(pick)}
				<li class="pick">
					<a class="team" href={localizeHref(`/teams/${pick.party.shortcode}`)}>
						{pick.party.name || m.party_untitled()}
						<span class="shortcode">{pick.party.shortcode}</span>
					</a>
					{#if readonly}
						{#if pick.note?.en}<p class="note">{pick.note.en}</p>{/if}
						{#if pick.note?.ja}<p class="note">{pick.note.ja}</p>{/if}
					{:else}
						<Input
							value={draft.en}
							oninput={(e) =>
								(drafts[pick.id] = { ...draft, en: (e.target as HTMLInputElement).value })}
							placeholder={m.db_picks_note_en()}
							contained
							fullWidth
						/>
						<Input
							value={draft.ja}
							oninput={(e) =>
								(drafts[pick.id] = { ...draft, ja: (e.target as HTMLInputElement).value })}
							placeholder={m.db_picks_note_jp()}
							contained
							fullWidth
						/>
						<div class="pick-actions">
							<Button variant="secondary" size="small" onclick={() => saveNote(pick)}>
								{m.db_picks_save()}
							</Button>
							<Button variant="ghost" size="small" onclick={() => removePick(pick)}>
								{m.db_picks_remove()}
							</Button>
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if readonly}
		<p class="hint">{m.db_picks_ended()}</p>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.picks {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: spacing.$unit-2x;
	}

	.pick-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.pick {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: spacing.$unit-half;
		padding: spacing.$unit;
		background: var(--input-bound-bg);
		border-radius: layout.$item-corner;
	}

	.team {
		color: var(--text-primary);
		font-weight: typography.$medium;
		text-decoration: none;
	}

	.shortcode {
		margin-left: spacing.$unit;
		font-family: monospace;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.pick-actions {
		display: flex;
		gap: spacing.$unit;
	}

	.note {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
