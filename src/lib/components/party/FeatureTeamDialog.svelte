<script lang="ts">
	/**
	 * Feature this team: make it a staff pick in general (always on Home) or
	 * for a running or upcoming event, or remove it from where it's featured.
	 * For curators and editors.
	 */
	import { createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import EventThumbnailImage from '$lib/components/home/EventThumbnailImage.svelte'
	import { eventQueries } from '$lib/api/queries/event.queries'
	import { useCreateStaffPick, useDeleteStaffPick } from '$lib/api/mutations/event.mutations'
	import { featuredPartyAdapter } from '$lib/api/adapters/featuredParty.adapter'
	import { buildFeatureRows, nextPickPosition, type FeatureRow } from '$lib/utils/featurePicks'
	import { countdownLabel, eventThumbnailUrl } from '$lib/utils/home'
	import { getElementLabel } from '$lib/utils/element'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { localizedName } from '$lib/utils/locale'
	import type { GameEvent } from '$lib/types/api/event'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		partyId: string
		role: number | null | undefined
	}

	let { open = $bindable(false), partyId, role }: Props = $props()

	const queryClient = useQueryClient()

	const currentQuery = createQuery(() => ({
		...eventQueries.list({ scope: 'current' }),
		enabled: open
	}))
	const upcomingQuery = createQuery(() => ({
		...eventQueries.list({ scope: 'upcoming' }),
		enabled: open
	}))
	const picksQuery = createQuery(() => eventQueries.partyPicks(partyId, open))

	const current = $derived(currentQuery.data ?? [])
	const upcoming = $derived(upcomingQuery.data ?? [])
	const picks = $derived(picksQuery.data ?? [])

	// Events the team is featured in that aren't running or upcoming
	const otherEventIds = $derived.by(() => {
		const listed = new Set([...current, ...upcoming].map((e) => e.id))
		return picks
			.map((p) => p.eventId)
			.filter((id): id is string => !!id && !listed.has(id))
			.sort()
	})
	const otherEventsQuery = createQuery(() => ({
		queryKey: ['events', 'detail-batch', otherEventIds] as const,
		queryFn: async () => {
			const events = await Promise.all(
				otherEventIds.map((id) =>
					queryClient.fetchQuery(eventQueries.byId(id)).catch(() => undefined)
				)
			)
			return Object.fromEntries(
				events.filter((e): e is GameEvent => !!e).map((e) => [e.id, e])
			) as Record<string, GameEvent>
		},
		enabled: open && currentQuery.isSuccess && upcomingQuery.isSuccess && otherEventIds.length > 0
	}))

	// Reset the notes and the clock each time the dialog opens
	let now = $state(Date.now())
	let noteEn = $state('')
	let noteJp = $state('')
	// Which language's note the one field edits
	let noteLanguage = $state<'en' | 'ja'>('en')
	$effect(() => {
		if (open) {
			now = Date.now()
			noteEn = ''
			noteJp = ''
			noteLanguage = 'en'
		}
	})

	const rows = $derived(
		buildFeatureRows({
			current,
			upcoming,
			picks,
			pickEvents: otherEventsQuery.data ?? {},
			role,
			now
		})
	)

	const loading = $derived(
		currentQuery.isPending || upcomingQuery.isPending || picksQuery.isPending
	)
	const loadFailed = $derived(currentQuery.isError || upcomingQuery.isError || picksQuery.isError)

	const createMut = useCreateStaffPick()
	const deleteMut = useDeleteStaffPick()
	let saving = $state(false)

	// The one row to feature the team in (or, if it's already there, remove it from)
	let selectedKey = $state<string | null>(null)
	$effect(() => {
		if (!open) selectedKey = null
	})
	const selectedRow = $derived(rows.find((row) => row.key === selectedKey))

	// Shadows on the header and the note while the list has more above or below
	let listEl = $state<HTMLElement>()
	let scrolledFromTop = $state(false)
	let scrolledToBottom = $state(true)
	function checkScroll() {
		if (!listEl) return
		const { scrollTop, scrollHeight, clientHeight } = listEl
		scrolledFromTop = scrollTop > 5
		scrolledToBottom = scrollTop + clientHeight >= scrollHeight - 5
	}
	$effect(() => {
		if (listEl && rows.length) setTimeout(checkScroll, 0)
	})

	function rowTitle(row: FeatureRow): string {
		if (row.state === 'general') return m.feature_general()
		return row.event ? localizedName(row.event.name) : m.feature_unknown_event()
	}

	function rowSubtitle(row: FeatureRow): string {
		const parts: string[] = []
		if (row.pick) parts.push(m.feature_featured())
		if (row.state === 'general') {
			const duration = row.pick?.expiresAt ? countdownLabel(row.pick.expiresAt, now) : null
			parts.push(duration ? m.home_ends_in({ duration }) : m.feature_general_hint())
		} else if (row.state === 'ended') {
			parts.push(m.feature_ended())
		} else if (row.event) {
			if (row.event.advantageElement) {
				parts.push(
					m.home_element_advantage({ element: getElementLabel(row.event.advantageElement) })
				)
			}
			const duration = countdownLabel(
				row.state === 'running' ? row.event.endsAt : row.event.startsAt,
				now
			)
			if (duration) {
				parts.push(
					row.state === 'running' ? m.home_ends_in({ duration }) : m.home_starts_in({ duration })
				)
			}
		}
		return parts.join(' · ')
	}

	// Features the team in the selected row with the note, or removes it from
	// there if it's already featured, then closes
	async function save() {
		const row = selectedRow
		if (!row) return
		saving = true
		try {
			if (row.pick) {
				await deleteMut.mutateAsync({ id: row.pick.id, eventId: row.eventId })
			} else {
				// New picks go after the others in the same place
				const existing = await featuredPartyAdapter.listFeaturedParties(
					row.eventId ? { eventId: row.eventId } : {}
				)
				const siblings = row.eventId ? existing : existing.filter((p) => !p.eventId)
				await createMut.mutateAsync({
					eventId: row.eventId,
					partyId,
					position: nextPickPosition(siblings),
					noteEn: noteEn.trim(),
					noteJp: noteJp.trim()
				})
			}
			open = false
		} catch (err) {
			toast.error(extractErrorMessage(err, m.db_picks_save_failed()))
		} finally {
			saving = false
		}
	}
</script>

<Dialog bind:open size="small">
	<ModalHeader title={m.feature_team()} showShadow={scrolledFromTop} />
	<ModalBody>
		{#if loadFailed}
			<p class="hint">{m.feature_load_failed()}</p>
		{:else if loading}
			<p class="hint">{m.feature_loading()}</p>
		{:else}
			<ul
				class="rows"
				role="radiogroup"
				aria-label={m.feature_team()}
				bind:this={listEl}
				onscroll={checkScroll}
			>
				{#each rows as row (row.key)}
					{@const isSelected = row.key === selectedKey}
					<li>
						<button
							type="button"
							class="row"
							class:selected={isSelected}
							role="radio"
							aria-checked={isSelected}
							disabled={!row.editable || saving}
							onclick={() => (selectedKey = row.key)}
						>
							<span class="thumb">
								{#if row.state === 'general'}
									<Icon name="home" size={16} />
								{:else}
									<EventThumbnailImage
										imageUrl={row.event ? eventThumbnailUrl(row.event) : null}
										label={rowTitle(row)}
									/>
								{/if}
							</span>
							<span class="text">
								<span class="title">{rowTitle(row)}</span>
								<span class="subtitle">{rowSubtitle(row)}</span>
							</span>
							<span class="check" aria-hidden="true">
								{#if isSelected}
									<Icon name="check" size={16} />
								{/if}
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</ModalBody>

	<div class="note" class:shadow={!scrolledToBottom}>
		<SegmentedControl
			value={noteLanguage}
			onValueChange={(v) => (noteLanguage = v === 'ja' ? 'ja' : 'en')}
			variant="background"
			size="small"
			grow
		>
			<!-- Language names are written in their own language -->
			<Segment value="en">English</Segment>
			<Segment value="ja">日本語</Segment>
		</SegmentedControl>
		{#if noteLanguage === 'en'}
			<textarea class="textarea" bind:value={noteEn} placeholder={m.feature_note()} rows="2"
			></textarea>
		{:else}
			<textarea class="textarea" bind:value={noteJp} placeholder={m.feature_note()} rows="2"
			></textarea>
		{/if}
	</div>

	<ModalFooter
		onCancel={() => (open = false)}
		cancelDisabled={saving}
		primaryAction={{
			label: selectedRow?.pick ? m.db_picks_remove() : m.feature_action(),
			destructive: !!selectedRow?.pick,
			onclick: save,
			disabled: !selectedRow || saving
		}}
	/>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/effects' as effects;

	// Rows are the thumbnail plus padding; the list shows four at a time
	$thumb-height: spacing.$unit * 7;
	$row-height: $thumb-height + spacing.$unit * 2;
	$row-gap: spacing.$unit-half;

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: $row-gap;
		max-height: $row-height * 4 + $row-gap * 3;
		overflow-y: auto;
	}

	.row {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		width: 100%;
		padding: spacing.$unit;
		border: none;
		border-radius: layout.$card-corner;
		background: none;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;

		&:hover:not(:disabled),
		&.selected {
			background: var(--button-bg);
		}

		&:disabled {
			cursor: default;
			opacity: 0.6;
		}
	}

	// Same shape as the Home event switcher's thumbnails
	.thumb {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		height: $thumb-height;
		aspect-ratio: 2 / 1;
		border-radius: layout.$item-corner;
		overflow: hidden;
		background: var(--button-bg);
		color: var(--text-secondary);
	}

	.text {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		flex: 1;
		min-width: 0;
	}

	.title {
		font-size: typography.$font-regular;
		color: var(--text-primary);
	}

	.subtitle {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.check {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: spacing.$unit-3x;
		color: var(--accent-blue);
	}

	// ModalFooter's padding spaces it from the buttons below
	.note {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x 0;
		position: relative;
		z-index: 1;
		@include effects.smooth-transition(effects.$duration-quick, box-shadow);

		// Same shadow as ModalFooter's
		&.shadow {
			box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);

			:global(html[data-theme='dark']) & {
				box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
			}
		}
	}

	.textarea {
		width: 100%;
		padding: spacing.$unit calc(spacing.$unit * 1.5);
		border: none;
		border-radius: layout.$input-corner;
		font-size: typography.$font-regular;
		font-family: inherit;
		background: var(--input-bound-bg);
		color: var(--text-primary);
		resize: vertical;
		box-sizing: border-box;
		// About 20% taller than two rows of text
		min-height: spacing.$unit * 8;

		&::placeholder {
			color: var(--text-tertiary);
			opacity: 1;
		}

		&:hover {
			background: var(--input-bound-bg-hover);
		}
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
