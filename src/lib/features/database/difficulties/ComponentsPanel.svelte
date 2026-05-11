<script lang="ts">
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { difficultyAdapter, type DifficultyComponent } from '$lib/api/adapters/difficulty.adapter'
	import { difficultyQueries } from '$lib/api/queries/difficulty.queries'
	import { extractErrorMessage } from '$lib/utils/errors'

	const queryClient = useQueryClient()

	const componentsQuery = createQuery(() => difficultyQueries.components())

	type ComponentDraft = {
		weight: number
		enabled: boolean
		minCountToScore: number
		targetMax: number | null
	}

	// Local edit state, keyed by component id; seeded from server values before
	// every render. Editors see live API values and can revert by reloading.
	let drafts = $state<Record<string, ComponentDraft>>({})

	// $effect.pre runs before DOM updates, so drafts are guaranteed populated
	// before the {#each} block evaluates bind expressions.
	$effect.pre(() => {
		for (const c of componentsQuery.data ?? []) {
			if (!drafts[c.id]) {
				drafts[c.id] = {
					weight: c.weight,
					enabled: c.enabled,
					minCountToScore: c.minCountToScore,
					targetMax: c.targetMax
				}
			}
		}
	})

	const updateMut = createMutation(() => ({
		mutationFn: (input: { id: string; data: Partial<DifficultyComponent> }) =>
			difficultyAdapter.updateComponent(input.id, input.data)
	}))

	function isDirty(comp: DifficultyComponent): boolean {
		const draft = drafts[comp.id]
		if (!draft) return false
		const draftTarget = draft.targetMax == null ? null : Number(draft.targetMax)
		const compTarget = comp.targetMax == null ? null : Number(comp.targetMax)
		return (
			Number(draft.weight) !== Number(comp.weight) ||
			Boolean(draft.enabled) !== Boolean(comp.enabled) ||
			Number(draft.minCountToScore) !== Number(comp.minCountToScore) ||
			draftTarget !== compTarget
		)
	}

	async function saveComponent(comp: DifficultyComponent) {
		const draft = drafts[comp.id]
		if (!draft) return
		try {
			await updateMut.mutateAsync({
				id: comp.id,
				data: {
					weight: Number(draft.weight),
					enabled: draft.enabled,
					minCountToScore: Number(draft.minCountToScore),
					targetMax:
						draft.targetMax == null || draft.targetMax === ('' as unknown as number)
							? null
							: Number(draft.targetMax)
				}
			})
			await queryClient.invalidateQueries({ queryKey: ['difficulties'] })
			toast.success(`Saved ${comp.name}`)
		} catch (err) {
			toast.error(extractErrorMessage(err, `Failed to save ${comp.name}`))
		}
	}

	const components = $derived(componentsQuery.data ?? [])
</script>

{#if componentsQuery.isLoading}
	<p class="empty">Loading components…</p>
{:else if components.length === 0}
	<p class="empty">No components found. Run the seed migration first.</p>
{:else}
	<div class="components-list">
		{#each components as comp (comp.id)}
			{#if drafts[comp.id]}
				<section class="component-card">
					<header class="component-header">
						<h4>{comp.name}</h4>
						<Button
							variant="ghost"
							size="small"
							onclick={() => saveComponent(comp)}
							disabled={!isDirty(comp) || updateMut.isPending}
						>
							{isDirty(comp) ? 'Save' : 'Saved'}
						</Button>
					</header>
					<div class="component-fields">
						<DetailItem
							label="Weight"
							sublabel="Relative contribution to the composite score"
							bind:value={drafts[comp.id]!.weight}
							editable={true}
							type="number"
							min={0}
						/>
						<DetailItem
							label="Min items to score"
							sublabel="Parties below this are not scored. Use 0 for job/accessory."
							bind:value={drafts[comp.id]!.minCountToScore}
							editable={true}
							type="number"
							min={0}
						/>
						<DetailItem
							label="Target max"
							sublabel="Optional. Overrides the denominator for raw_score. Leave blank to use the sum of every rule's max contribution."
							bind:value={drafts[comp.id]!.targetMax as number | null | undefined}
							editable={true}
							type="number"
							min={0}
						/>
						<DetailItem
							label="Enabled"
							sublabel="Disabled components are excluded from scoring"
							bind:value={drafts[comp.id]!.enabled}
							editable={true}
							type="checkbox"
						/>
					</div>
				</section>
			{/if}
		{/each}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.components-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.component-card {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit-2x 0;
		border-bottom: 1px solid var(--border-subtle);

		&:last-child {
			border-bottom: none;
		}
	}

	.component-header {
		display: flex;
		justify-content: space-between;
		align-items: center;

		h4 {
			margin: 0;
			color: var(--text-primary);
			font-size: typography.$font-medium;
			font-weight: typography.$bold;
			text-transform: capitalize;
		}
	}

	.component-fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.empty {
		padding: spacing.$unit-4x;
		text-align: center;
		color: var(--text-secondary);
	}
</style>
