<script lang="ts">
	/**
	 * Staff picks for one event: add a team by its link or shortcode, edit the
	 * EN/JA note, remove it. Notes are rendered as plain text.
	 */
	import { createQuery } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { eventQueries } from '$lib/api/queries/event.queries'
	import {
		useCreateStaffPick,
		useDeleteStaffPick,
		useUpdateStaffPick
	} from '$lib/api/mutations/event.mutations'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { shortcodeFromInput } from '$lib/utils/shortcode'
	import { localizeHref } from '$lib/paraglide/runtime'
	import type { FeaturedParty } from '$lib/types/api/featuredParty'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		eventId: string
	}

	let { eventId }: Props = $props()

	const picksQuery = createQuery(() => eventQueries.staffPicks(eventId))
	const picks = $derived([...(picksQuery.data ?? [])].sort((a, b) => a.position - b.position))

	const createMut = useCreateStaffPick()
	const updateMut = useUpdateStaffPick()
	const deleteMut = useDeleteStaffPick()

	let teamInput = $state('')
	let noteEn = $state('')
	let noteJp = $state('')
	let adding = $state(false)

	// Per-pick note drafts, keyed by pick id
	let drafts = $state<Record<string, { en: string; ja: string }>>({})
	function draftFor(pick: FeaturedParty) {
		return drafts[pick.id] ?? { en: pick.note?.en ?? '', ja: pick.note?.ja ?? '' }
	}

	async function addPick() {
		const shortcode = shortcodeFromInput(teamInput)
		if (!shortcode) {
			toast.error(m.db_picks_invalid_team())
			return
		}
		adding = true
		try {
			const party = await partyAdapter.getByShortcode(shortcode)
			await createMut.mutateAsync({
				eventId,
				partyId: party.id,
				position: picks.length,
				noteEn: noteEn.trim(),
				noteJp: noteJp.trim()
			})
			teamInput = ''
			noteEn = ''
			noteJp = ''
		} catch (err) {
			toast.error(extractErrorMessage(err, m.db_picks_add_failed()))
		} finally {
			adding = false
		}
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

<DetailsContainer title={m.db_picks_title()}>
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
					</li>
				{/each}
			</ul>
		{/if}

		<div class="add">
			<Input
				bind:value={teamInput}
				placeholder={m.db_picks_team_placeholder()}
				contained
				fullWidth
			/>
			<Input bind:value={noteEn} placeholder={m.db_picks_note_en()} contained fullWidth />
			<Input bind:value={noteJp} placeholder={m.db_picks_note_jp()} contained fullWidth />
			<Button
				variant="primary"
				size="small"
				onclick={addPick}
				disabled={adding || !teamInput.trim()}
			>
				{m.db_picks_add()}
			</Button>
		</div>
	</div>
</DetailsContainer>

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

	.pick,
	.add {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: spacing.$unit-half;
		padding: spacing.$unit;
		background: var(--input-bound-bg);
		border-radius: layout.$item-corner;
	}

	.add {
		background: transparent;
		padding: 0;
		align-items: flex-start;
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

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
