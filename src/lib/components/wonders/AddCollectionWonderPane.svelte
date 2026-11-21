<script lang="ts">
	/**
	 * AddCollectionWonderPane - picks a Wonder to add to the owner's
	 * collection: a grid of the Wonders they don't have, grouped by category.
	 * The header action is Add for Wonders with nothing to set up, or Next,
	 * which pushes the setup pane (level, uncap or recruited count).
	 */
	import { untrack } from 'svelte'
	import { page } from '$app/stores'
	import { toast } from 'svelte-sonner'
	import { m } from '$lib/paraglide/messages'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import WonderImage from './WonderImage.svelte'
	import CollectionWonderEditPane from './CollectionWonderEditPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { useAddCollectionWonder } from '$lib/api/mutations/wonder.mutations'
	import { compareCatalogueOrder, stateOf, wonderImageName } from '$lib/features/wonders/wonders'
	import { wonderText } from '$lib/features/wonders/labels'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { uuid } from '$lib/utils/uuid'
	import type { UserCookie } from '$lib/types/UserCookie'
	import type { Wonder, WonderCatalogue } from '$lib/types/api/wonder'

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		catalogue: WonderCatalogue
		/** Catalogue ids of the Wonders the owner already has */
		ownedIds: string[]
	}

	let { paneId, catalogue, ownedIds }: Props = $props()

	const addMutation = useAddCollectionWonder()

	const currentUser = $derived($page.data?.currentUser as UserCookie | null)
	const accentColor = $derived(
		currentUser?.element ? `var(--${currentUser.element}-button-bg)` : 'var(--text-primary)'
	)

	const groups = $derived.by(() => {
		const owned = new Set(ownedIds)
		const available = catalogue.wonders
			.filter((w) => !owned.has(w.id))
			.sort(compareCatalogueOrder(catalogue))
		return [...catalogue.categories]
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((category) => ({
				category,
				wonders: available.filter((w) => w.categoryId === category.id)
			}))
			.filter((group) => group.wonders.length > 0)
	})

	let selectedId = $state<string | null>(null)
	const selected = $derived(catalogue.wonders.find((w) => w.id === selectedId) ?? null)

	/** Leveled Wonders and Symbolum have something to set before adding */
	function needsSetup(wonder: Wonder) {
		return wonder.kind !== 'fixed'
	}

	function toggle(wonder: Wonder) {
		selectedId = selectedId === wonder.id ? null : wonder.id
	}

	function next() {
		if (!selected) return
		sidebar.push({
			id: uuid(),
			title: wonderText(selected.name),
			component: CollectionWonderEditPane,
			props: { catalogue, mode: { kind: 'add', wonderId: selected.id } },
			scrollable: true
		})
	}

	async function add() {
		if (!selected || addMutation.isPending) return
		const name = wonderText(selected.name)
		try {
			await addMutation.mutateAsync({
				wonderId: selected.id,
				active: true,
				...stateOf(selected, null)
			})
			toast.success(m.wonders_added({ name }))
			sidebar.close()
		} catch (err: unknown) {
			toast.error(extractErrorMessage(err, m.wonders_save_failed()))
		}
	}

	$effect(() => {
		const wonder = selected
		const pending = addMutation.isPending
		untrack(() => {
			const setup = !!wonder && needsSetup(wonder)
			const action = !wonder || pending ? undefined : setup ? next : add
			const label = setup ? m.action_next() : m.action_add()
			if (paneId) sidebar.setActionForPane(paneId, action, label)
			else sidebar.setAction(action, label)
		})
	})
</script>

<div class="add-wonder" style:--accent-color={accentColor}>
	{#if groups.length === 0}
		<p class="hint">{m.wonders_all_owned()}</p>
	{:else}
		{#each groups as group (group.category.id)}
			<DetailsSection title={wonderText(group.category.name)}>
				<div class="grid">
					{#each group.wonders as wonder (wonder.id)}
						{@const name = wonderText(wonder.name)}
						<button
							type="button"
							class="wonder"
							class:selected={selectedId === wonder.id}
							aria-pressed={selectedId === wonder.id}
							onclick={() => toggle(wonder)}
						>
							<WonderImage image={wonderImageName(wonder, stateOf(wonder, null))} size={64} />
							<span class="name">{name}</span>
						</button>
					{/each}
				</div>
			</DetailsSection>
		{/each}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;

	.add-wonder {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
		gap: $unit-2x $unit;
		padding: 0 $unit;
	}

	.wonder {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $unit-half;
		padding: 0;
		background: none;
		border: none;
		color: inherit;
		font: inherit;
		text-align: center;
		cursor: pointer;
		@include smooth-transition($duration-quick, transform);

		&:active {
			transform: scale(0.97);
		}

		:global(.wonder-image) {
			outline: 2px solid transparent;
			outline-offset: 2px;
		}

		&.selected {
			:global(.wonder-image) {
				outline-color: var(--accent-color);
			}

			.name {
				color: var(--accent-color);
			}
		}
	}

	.name {
		width: 100%;
		font-size: $font-small;
		font-weight: $medium;
		color: var(--text-primary);
		line-height: 1.3;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.hint {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: var(--text-tertiary);
	}
</style>
