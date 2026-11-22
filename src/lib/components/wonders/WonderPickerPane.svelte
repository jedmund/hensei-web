<script lang="ts">
	/**
	 * WonderPickerPane - picks a Wonder to add: a grid of the candidates,
	 * grouped by category. Tapping a Wonder with something to set up (level,
	 * uncap or recruited count) pushes WonderSetupPane, whose Add adds it;
	 * the others are selected and added with the header's Add. Shared by the
	 * collection and a team's Wonders; the caller adds, toasts and navigates.
	 */
	import { untrack } from 'svelte'
	import { page } from '$app/stores'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import { m } from '$lib/paraglide/messages'
	import WonderImage from './WonderImage.svelte'
	import WonderSetupPane from './WonderSetupPane.svelte'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import {
		compareCatalogueOrder,
		groupByCategory,
		stateOf,
		wonderImageName
	} from '$lib/features/wonders/wonders'
	import { wonderText } from '$lib/features/wonders/labels'
	import { uuid } from '$lib/utils/uuid'
	import type { UserCookie } from '$lib/types/UserCookie'
	import type { Wonder, WonderCatalogue, WonderState } from '$lib/types/api/wonder'

	interface Props {
		/** Pane ID injected by PaneStack */
		paneId?: string
		catalogue: WonderCatalogue
		/** The Wonders that can be added */
		candidates: Wonder[]
		/** Shown when there are no candidates */
		emptyMessage: string
		/** Whether the setup pane shows the Active switch */
		showActive?: boolean
		onAdd: (wonder: Wonder, state: WonderState, active: boolean) => Promise<void>
	}

	let { paneId, catalogue, candidates, emptyMessage, showActive = true, onAdd }: Props = $props()

	const currentUser = $derived($page.data?.currentUser as UserCookie | null)
	const accentColor = $derived(
		currentUser?.element ? `var(--${currentUser.element}-button-bg)` : 'var(--text-primary)'
	)

	const groups = $derived(
		groupByCategory([...candidates].sort(compareCatalogueOrder(catalogue)), (w) => w, catalogue)
	)

	let selectedId = $state<string | null>(null)
	let pending = $state(false)
	const selected = $derived(candidates.find((w) => w.id === selectedId) ?? null)

	/** Leveled Wonders and Symbolum have something to set before adding */
	function needsSetup(wonder: Wonder) {
		return wonder.kind !== 'fixed'
	}

	function choose(wonder: Wonder) {
		if (!needsSetup(wonder)) {
			selectedId = selectedId === wonder.id ? null : wonder.id
			return
		}
		selectedId = null
		sidebar.push({
			id: uuid(),
			title: wonderText(wonder.name),
			component: WonderSetupPane,
			props: {
				wonder,
				showActive,
				onSubmit: (state: WonderState, active: boolean) => onAdd(wonder, state, active)
			},
			scrollable: true
		})
	}

	async function add() {
		if (!selected || pending) return
		pending = true
		try {
			await onAdd(selected, stateOf(selected, null), true)
		} finally {
			pending = false
		}
	}

	$effect(() => {
		const enabled = !!selected && !pending
		untrack(() => {
			const action = enabled ? add : undefined
			if (paneId) sidebar.setActionForPane(paneId, action, m.action_add())
			else sidebar.setAction(action, m.action_add())
		})
	})
</script>

<div class="wonder-picker" style:--accent-color={accentColor}>
	{#if groups.length === 0}
		<p class="hint">{emptyMessage}</p>
	{:else}
		{#each groups as group (group.category.id)}
			<DetailsSection title={wonderText(group.category.name)}>
				<div class="grid">
					{#each group.items as wonder (wonder.id)}
						{@const name = wonderText(wonder.name)}
						<button
							type="button"
							class="wonder"
							class:selected={selectedId === wonder.id}
							aria-pressed={needsSetup(wonder) ? undefined : selectedId === wonder.id}
							onclick={() => choose(wonder)}
						>
							<WonderImage image={wonderImageName(wonder, stateOf(wonder, null))} size={88} />
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

	.wonder-picker {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
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
		overflow-wrap: anywhere;
	}

	.hint {
		margin: 0;
		padding: 0 $unit-2x;
		font-size: $font-small;
		color: var(--text-tertiary);
	}
</style>
