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
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
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
	$effect(() => {
		if (open) {
			now = Date.now()
			noteEn = ''
			noteJp = ''
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
	let busyKey = $state<string | null>(null)

	function rowTitle(row: FeatureRow): string {
		if (row.state === 'general') return m.feature_general()
		return row.event ? localizedName(row.event.name) : m.feature_unknown_event()
	}

	function rowSubtitle(row: FeatureRow): string {
		const parts: string[] = []
		if (row.pick) parts.push(m.feature_featured())
		if (row.state === 'general') {
			parts.push(m.feature_general_hint())
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

	async function feature(row: FeatureRow) {
		busyKey = row.key
		try {
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
		} catch (err) {
			toast.error(extractErrorMessage(err, m.db_picks_add_failed()))
		} finally {
			busyKey = null
		}
	}

	async function remove(row: FeatureRow) {
		if (!row.pick) return
		busyKey = row.key
		try {
			await deleteMut.mutateAsync({ id: row.pick.id, eventId: row.eventId })
		} catch (err) {
			toast.error(extractErrorMessage(err, m.db_picks_save_failed()))
		} finally {
			busyKey = null
		}
	}
</script>

<Dialog bind:open size="small">
	<ModalHeader title={m.feature_team()} description={m.feature_description()} />
	<ModalBody>
		<div class="content">
			<div class="notes">
				<Input bind:value={noteEn} placeholder={m.db_picks_note_en()} contained fullWidth />
				<Input bind:value={noteJp} placeholder={m.db_picks_note_jp()} contained fullWidth />
			</div>

			{#if loadFailed}
				<p class="hint">{m.feature_load_failed()}</p>
			{:else if loading}
				<p class="hint">{m.feature_loading()}</p>
			{:else}
				<ul class="rows">
					{#each rows as row (row.key)}
						<li>
							<SettingsRow title={rowTitle(row)} subtitle={rowSubtitle(row)} compact>
								{#snippet icon()}
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
								{/snippet}
								{#snippet control()}
									{#if row.pick}
										<Button
											variant="secondary"
											size="small"
											onclick={() => remove(row)}
											disabled={!row.editable || busyKey !== null}
										>
											{m.db_picks_remove()}
										</Button>
									{:else}
										<Button
											variant="primary"
											size="small"
											onclick={() => feature(row)}
											disabled={!row.editable || busyKey !== null}
										>
											{m.feature_action()}
										</Button>
									{/if}
								{/snippet}
							</SettingsRow>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</ModalBody>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding-bottom: spacing.$unit-2x;
	}

	.notes {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	// Same shape as the Home event switcher's thumbnails
	.thumb {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 80px;
		aspect-ratio: 2 / 1;
		border-radius: layout.$item-corner;
		overflow: hidden;
		background: var(--button-bg);
		color: var(--text-secondary);
	}

	.hint {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}
</style>
