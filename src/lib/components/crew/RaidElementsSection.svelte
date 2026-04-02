<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query'
	import { raidQueries } from '$lib/api/queries/raid.queries'
	import { userRaidElementQueries } from '$lib/api/queries/userRaidElement.queries'
	import { userRaidElementAdapter } from '$lib/api/adapters/userRaidElement.adapter'
	import { SvelteMap } from 'svelte/reactivity'
	import type { Raid } from '$lib/types/api/entities'
	import RaidElementRow from './RaidElementRow.svelte'

	interface Props {
		username: string
		isOwnProfile: boolean
	}

	let { username, isOwnProfile }: Props = $props()

	const queryClient = useQueryClient()

	// Fetch all raids to find trackable ones
	const raidsQuery = createQuery(() => raidQueries.all())
	const trackableRaids = $derived((raidsQuery.data ?? []).filter((r: Raid) => r.trackable === true))

	// Fetch user's raid elements — always use the for_user endpoint (works for own profile too)
	const elementsQuery = createQuery(() => userRaidElementQueries.forUser(username))

	// Edit state
	let editing = $state(false)
	let localElements = new SvelteMap<string, number[]>()

	function startEditing() {
		localElements.clear()
		for (const entry of elementsQuery.data ?? []) {
			localElements.set(entry.raidId, [...entry.elements])
		}
		editing = true
	}

	function cancelEditing() {
		editing = false
		localElements.clear()
	}

	function toggleElement(raidId: string, element: number) {
		const current = localElements.get(raidId) ?? []
		const next = current.includes(element)
			? current.filter((e) => e !== element)
			: [...current, element]
		localElements.set(raidId, next)
	}

	const syncMutation = createMutation(() => ({
		mutationFn: ({ raidId, elements }: { raidId: string; elements: number[] }) =>
			userRaidElementAdapter.syncRaidElements(raidId, elements),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['userRaidElements'] })
		}
	}))

	async function save() {
		const original: Record<string, number[]> = {}
		for (const entry of elementsQuery.data ?? []) {
			original[entry.raidId] = [...entry.elements].sort()
		}

		const promises: Promise<unknown>[] = []
		for (const raid of trackableRaids) {
			const newEls = (localElements.get(raid.id) ?? []).sort()
			const oldEls = (original[raid.id] ?? []).sort()
			if (JSON.stringify(newEls) !== JSON.stringify(oldEls)) {
				promises.push(syncMutation.mutateAsync({ raidId: raid.id, elements: newEls }))
			}
		}

		await Promise.all(promises)
		editing = false
	}

	// Only show section if trackable raids exist AND (user has elements OR is own profile)
	const hasElements = $derived((elementsQuery.data ?? []).length > 0)
	const showSection = $derived(trackableRaids.length > 0 && (hasElements || isOwnProfile))

	function getElementsForRaid(raidId: string): number[] {
		if (editing) {
			return localElements.get(raidId) ?? []
		}
		const entry = (elementsQuery.data ?? []).find((e) => e.raidId === raidId)
		return entry?.elements ?? []
	}
</script>

{#if showSection}
	<div class="raid-elements-section">
		<div class="section-header">
			<span class="section-title">{m.crew_raid_elements()}</span>
			{#if isOwnProfile}
				<div class="section-actions">
					{#if editing}
						<button class="action-btn" onclick={cancelEditing}>
							{m.crew_raid_elements_cancel()}
						</button>
						<button class="action-btn primary" onclick={save} disabled={syncMutation.isPending}>
							{m.crew_raid_elements_save()}
						</button>
					{:else}
						<button class="action-btn" onclick={startEditing}>
							{m.crew_raid_elements_edit()}
						</button>
					{/if}
				</div>
			{/if}
		</div>

		{#if elementsQuery.isLoading || raidsQuery.isLoading}
			<div class="loading-state">
				<p>{m.crew_loading_generic()}</p>
			</div>
		{:else}
			<div class="raid-list">
				{#each trackableRaids as raid (raid.id)}
					{@const elements = getElementsForRaid(raid.id)}
					{#if editing || elements.length > 0}
						<RaidElementRow
							raidName={raid.name}
							{elements}
							editable={editing}
							onToggle={(el) => toggleElement(raid.id, el)}
						/>
					{/if}
				{/each}

				{#if !editing && !hasElements}
					<div class="empty-state">
						{m.crew_raid_elements_empty()}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.raid-elements-section {
		border-top: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.section-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.section-actions {
		display: flex;
		gap: spacing.$unit-half;
	}

	.action-btn {
		padding: 4px 12px;
		border: 1px solid var(--border-color, rgba(0, 0, 0, 0.12));
		border-radius: 6px;
		background: transparent;
		font-size: typography.$font-small;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background 0.15s;

		&:hover {
			background: rgba(0, 0, 0, 0.04);
		}

		&.primary {
			background: var(--accent-color, #4a90d9);
			color: white;
			border-color: transparent;

			&:hover {
				opacity: 0.9;
			}
		}

		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}

	.loading-state {
		display: flex;
		justify-content: center;
		padding: spacing.$unit-2x;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-2x;
		font-size: typography.$font-small;
	}
</style>
