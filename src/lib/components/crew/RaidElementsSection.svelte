<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { createQuery } from '@tanstack/svelte-query'
	import { SvelteMap } from 'svelte/reactivity'
	import { toast } from 'svelte-sonner'
	import { raidQueries } from '$lib/api/queries/raid.queries'
	import { userRaidElementQueries } from '$lib/api/queries/userRaidElement.queries'
	import { useSyncRaidElements } from '$lib/api/mutations/userRaidElement.mutations'
	import { ELEMENT_DISPLAY_ORDER } from '$lib/utils/element'
	import { extractErrorMessage } from '$lib/utils/errors'
	import type { LocalizedName } from '$lib/types/api/entities'
	import Button from '$lib/components/ui/Button.svelte'
	import ElementBadge from '$lib/components/ui/ElementBadge.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'

	interface Props {
		username: string
		/** The viewer's own page: they can edit */
		isOwnProfile: boolean
	}

	let { username, isOwnProfile }: Props = $props()

	const raidsQuery = createQuery(() => raidQueries.trackable())
	const elementsQuery = createQuery(() => userRaidElementQueries.forUser(username))
	const syncMutation = useSyncRaidElements()

	const raids = $derived(raidsQuery.data ?? [])

	/** Saved elements by raid id, in display order */
	const saved: Record<string, number[]> = $derived(
		Object.fromEntries((elementsQuery.data ?? []).map((row) => [row.raidId, sorted(row.elements)]))
	)

	let editing = $state(false)
	let saving = $state(false)
	const draft = new SvelteMap<string, number[]>()

	const rows = $derived(
		raids
			.map((raid) => ({
				id: raid.id,
				name: raid.name,
				elements: (editing ? draft.get(raid.id) : saved[raid.id]) ?? []
			}))
			.filter((row) => editing || row.elements.length > 0)
	)

	const hasSaved = $derived(raids.some((raid) => (saved[raid.id] ?? []).length > 0))
	const visible = $derived(raids.length > 0 && !elementsQuery.isError && (isOwnProfile || hasSaved))

	function sorted(elements: number[]): number[] {
		return ELEMENT_DISPLAY_ORDER.filter((element) => elements.includes(element))
	}

	function localizedName(name: LocalizedName): string {
		return (getLocale() === 'ja' ? name.ja : name.en) || name.en || name.ja || ''
	}

	function startEditing() {
		draft.clear()
		for (const raid of raids) draft.set(raid.id, saved[raid.id] ?? [])
		editing = true
	}

	function cancelEditing() {
		editing = false
		draft.clear()
	}

	function setElements(raidId: string, value: number | number[]) {
		draft.set(raidId, sorted(Array.isArray(value) ? value : [value]))
	}

	async function save() {
		const changed = raids.filter((raid) => {
			const before = (saved[raid.id] ?? []).join(',')
			return (draft.get(raid.id) ?? []).join(',') !== before
		})

		saving = true
		try {
			await Promise.all(
				changed.map((raid) =>
					syncMutation.mutateAsync({ raidId: raid.id, elements: draft.get(raid.id) ?? [] })
				)
			)
			editing = false
			draft.clear()
		} catch (error) {
			toast.error(extractErrorMessage(error, m.crew_raid_elements_save_failed()))
		} finally {
			saving = false
		}
	}
</script>

{#if visible}
	<section class="raid-elements">
		<div class="section-header">
			<span class="section-title">{m.crew_raid_elements()}</span>
			{#if isOwnProfile}
				<div class="actions">
					{#if editing}
						<Button variant="ghost" size="small" onclick={cancelEditing} disabled={saving}>
							{m.action_cancel()}
						</Button>
						<Button variant="primary" size="small" onclick={save} disabled={saving}>
							{m.action_save()}
						</Button>
					{:else}
						<Button
							variant="secondary"
							size="small"
							onclick={startEditing}
							disabled={elementsQuery.isLoading}
						>
							{m.action_edit()}
						</Button>
					{/if}
				</div>
			{/if}
		</div>

		{#if rows.length === 0}
			<div class="empty-state">{m.crew_raid_elements_empty()}</div>
		{:else}
			<ul class="raid-list">
				{#each rows as row (row.id)}
					<li class="raid-row">
						<span class="raid-name">{localizedName(row.name)}</span>
						{#if editing}
							<ElementPicker
								value={row.elements}
								onValueChange={(value) => setElements(row.id, value)}
								multiple
								mode="segmented"
								size="small"
								contained
								disabled={saving}
							/>
						{:else}
							<div class="badges">
								{#each row.elements as element (element)}
									<ElementBadge {element} />
								{/each}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</section>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.raid-elements {
		border-bottom: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x;
		background: rgba(0, 0, 0, 0.02);
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}

	.section-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
	}

	.actions {
		display: flex;
		gap: spacing.$unit-half;
	}

	.raid-list {
		list-style: none;
		margin: 0;
		padding: spacing.$unit;
	}

	.raid-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x;
	}

	.raid-name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.badges {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		padding: spacing.$unit-3x;
		font-size: typography.$font-small;
	}
</style>
