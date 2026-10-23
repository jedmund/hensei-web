<script lang="ts">
	import { createInfiniteQuery, keepPreviousData, useQueryClient } from '@tanstack/svelte-query'
	import { collectionQueries } from '$lib/api/queries/collection.queries'
	import { getSummonImage } from '$lib/utils/images'
	import { getElementLabel } from '$lib/utils/element'
	import { localizedName } from '$lib/utils/locale'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import { getElementImage } from '$lib/utils/element'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { CollectionSummon } from '$lib/types/api/collection'
	import type { SupportSummonSection } from '$lib/types/api/supportSummon'

	interface Props {
		open: boolean
		userId: string
		section: SupportSummonSection
		position: number
		currentCollectionSummonId?: string | undefined
		onPick: (cs: CollectionSummon) => void
		onClear?: (() => void) | undefined
	}

	let {
		open = $bindable(false),
		userId,
		section,
		position,
		currentCollectionSummonId,
		onPick,
		onClear
	}: Props = $props()

	// Internal element ids: wind=1, fire=2, water=3, earth=4, dark=5, light=6.
	const SECTION_TO_ELEMENT: Record<Exclude<SupportSummonSection, 'misc'>, number> = {
		wind: 1,
		fire: 2,
		water: 3,
		earth: 4,
		dark: 5,
		light: 6
	}

	const sectionElementId = $derived(section === 'misc' ? undefined : SECTION_TO_ELEMENT[section])
	const sectionLabel = $derived(
		section === 'misc' ? m.support_summon_picker_section_misc() : getElementLabel(sectionElementId)
	)

	let elementFilter = $state<number[]>([])
	let searchInput = $state('')

	const queryClient = useQueryClient()

	$effect(() => {
		if (open) {
			elementFilter = section === 'misc' ? [] : [SECTION_TO_ELEMENT[section]]
			searchInput = ''
			void prefetchAllVariants()
		}
	})

	/**
	 * Prefetch every element-filter variant the user might toggle to so the
	 * results region doesn't flash an empty state when they switch filters.
	 * Runs in parallel; each call is a no-op if the data is already cached
	 * within the query's `staleTime`.
	 */
	async function prefetchAllVariants() {
		if (!userId) return
		const baseFilters = [
			{}, // "All elements" — used by misc + cleared filter
			{ element: [1] }, // wind
			{ element: [2] }, // fire
			{ element: [3] }, // water
			{ element: [4] }, // earth
			{ element: [5] }, // dark
			{ element: [6] } // light
		]
		await Promise.all(
			baseFilters.map((filters) =>
				queryClient.prefetchInfiniteQuery(
					collectionQueries.summons(userId, {
						...filters,
						sort: 'uncap_desc' as const,
						supportEligible: true
					})
				)
			)
		)
	}

	let debouncedSearch = $state('')
	let debounceTimer: ReturnType<typeof setTimeout> | undefined
	$effect(() => {
		const value = searchInput
		if (debounceTimer) clearTimeout(debounceTimer)
		debounceTimer = setTimeout(() => {
			debouncedSearch = value
		}, 200)
		return () => {
			if (debounceTimer) clearTimeout(debounceTimer)
		}
	})

	const collectionQuery = createInfiniteQuery(() => ({
		...collectionQueries.summons(userId, {
			// Sort the element array so [6, 5] and [5, 6] share a cache key.
			...(elementFilter.length > 0 ? { element: [...elementFilter].sort((a, b) => a - b) } : {}),
			...(debouncedSearch ? { search: debouncedSearch } : {}),
			sort: 'uncap_desc' as const,
			supportEligible: true
		}),
		enabled: !!userId && open,
		// Keep showing the previous results while the new query loads —
		// prevents the flash of empty state when toggling filter combinations
		// that haven't been prefetched (e.g. multi-element combos).
		placeholderData: keepPreviousData
	}))

	const items = $derived.by<CollectionSummon[]>(() => {
		const pages = collectionQuery.data?.pages ?? []
		return pages.flatMap((p) => p.results)
	})

	function thumbFor(cs: CollectionSummon): string {
		return getSummonImage(cs.summon?.granblueId, 'square')
	}

	function handleElementChange(value: number | number[]) {
		elementFilter = Array.isArray(value) ? value : value === 0 ? [] : [value]
	}

	function handlePick(cs: CollectionSummon) {
		onPick(cs)
		open = false
	}

	function handleClear() {
		onClear?.()
		open = false
	}

	// Scroll-aware shadow state — mirrors the sidebar search pane behavior.
	let scrolledTop = $state(false)
	let scrolledBottom = $state(false)
	let resultsEl: HTMLElement | undefined

	function updateScrollState(el: HTMLElement) {
		scrolledTop = el.scrollTop > 0
		// scrolledBottom = there is still content below (i.e. NOT at the bottom).
		scrolledBottom = el.scrollTop + el.clientHeight + 1 < el.scrollHeight
	}

	function handleResultsScroll(event: Event) {
		updateScrollState(event.currentTarget as HTMLElement)
	}

	// Recompute on item-list changes (filter/search updates the result count).
	$effect(() => {
		void items
		if (resultsEl) updateScrollState(resultsEl)
	})
</script>

<Dialog bind:open size="small" class="support-summon-picker-dialog">
	<ModalHeader title={m.support_summon_picker_title()}>
		{#snippet description()}
			<div class="slot-subtitle">
				{#if sectionElementId !== undefined}
					<img
						class="element-icon"
						src={getElementImage(sectionElementId)}
						alt=""
						aria-hidden="true"
					/>
				{/if}
				<span>{sectionLabel}</span>
				<span class="sep">·</span>
				<span>{m.support_summon_picker_slot({ position: position + 1 })}</span>
			</div>
		{/snippet}
	</ModalHeader>
	<div class="controls" class:scrolled={scrolledTop}>
		<Input
			bind:value={searchInput}
			type="text"
			placeholder={m.support_summon_picker_search_placeholder()}
			leftIcon="search"
			contained
			fullWidth
			clearable
		/>
		<ElementPicker
			value={elementFilter}
			onValueChange={handleElementChange}
			multiple
			mode="segmented"
			size="small"
			contained
			showClear
		/>
	</div>

	<div class="results" bind:this={resultsEl} onscroll={handleResultsScroll}>
		{#if collectionQuery.isLoading}
			<p class="status">{m.support_summon_picker_loading()}</p>
		{:else if items.length === 0}
			<p class="status">{m.support_summon_picker_empty()}</p>
		{:else}
			<ul class="result-list" role="listbox">
				{#each items as cs (cs.id)}
					<li class="result-item">
						<button
							type="button"
							class="result-button"
							class:active={cs.id === currentCollectionSummonId}
							onclick={() => handlePick(cs)}
							aria-label={localizedName(cs.summon?.name) ?? ''}
						>
							<div class="result-image-wrapper">
								<img src={thumbFor(cs)} alt="" class="result-image" loading="lazy" />
							</div>
							<div class="result-info">
								<span class="result-name">{localizedName(cs.summon?.name) ?? ''}</span>
								<div class="result-labels">
									{#if cs.summon?.element !== undefined}
										<ElementLabel element={cs.summon.element} size="small" />
									{/if}
									<UncapIndicator
										type="summon"
										uncapLevel={cs.uncapLevel}
										transcendenceStage={cs.transcendenceStep}
										flb={cs.summon?.uncap?.flb ?? false}
										ulb={cs.summon?.uncap?.ulb ?? false}
										transcendence={cs.summon?.uncap?.transcendence ?? false}
									/>
								</div>
							</div>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
	<div class="footer" class:scrolled={scrolledBottom}>
		{#if currentCollectionSummonId && onClear}
			<Button variant="ghost" size="small" onclick={handleClear}>
				{m.support_summon_picker_clear()}
			</Button>
		{/if}
		<div class="footer-spacer"></div>
		<Button variant="ghost" size="small" onclick={() => (open = false)}>
			{m.modal_close()}
		</Button>
	</div>
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	// Constrain the picker's height so it doesn't tower over the parent Support
	// Summons modal (which is content-sized to ~750px on a desktop viewport).
	// `min(90vh, 750px)` matches that height on large screens while letting
	// smaller viewports continue to use 90vh of available space.
	:global(.support-summon-picker-dialog) {
		max-height: min(90vh, 750px);
	}

	// Controls + results + footer mirror the sidebar search pane's layout:
	// a fixed-height controls region at top, a flex-fill scrollable results
	// region, and a footer; both controls and footer get a drop-shadow when
	// the results region has scrollable content past their edge.
	.controls {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: $unit $unit-2x;
		position: relative;
		z-index: 1;
		transition: box-shadow 0.2s ease;

		// Mirrors `ModalFooter`'s shadow tuning — softer than the sidebar
		// pattern since the dialog already has its own elevation + overlay.
		&.scrolled {
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

			:global(html[data-theme='dark']) & {
				box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
			}
		}
	}

	.results {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		padding: $unit $unit-2x;
	}

	.slot-subtitle {
		display: inline-flex;
		align-items: center;
		gap: $unit-half;
		font-size: $font-small;
		color: var(--text-secondary);

		.element-icon {
			width: $unit-3x;
			height: $unit-3x;
			display: block;
		}

		.sep {
			opacity: 0.6;
		}
	}

	.status {
		margin: 0;
		padding: $unit-3x 0;
		text-align: center;
		color: var(--text-secondary);
		font-size: $font-small;
	}

	.result-list {
		display: flex;
		flex-direction: column;
		gap: 0;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.result-item {
		list-style: none;

		.result-button {
			width: 100%;
			display: flex;
			align-items: center;
			gap: $unit;
			padding: $unit;
			border: none;
			border-radius: $input-corner;
			background: transparent;
			cursor: pointer;
			transition: background-color 0.15s ease-out;
			text-align: left;

			&:hover {
				background: var(--list-cell-bg-hover);
			}

			&:active {
				transform: scale(0.99);
			}

			&.active {
				background: var(--list-cell-bg-hover);
			}

			&:focus-visible {
				outline: 2px solid var(--focus-ring);
				outline-offset: -2px;
			}
		}

		.result-image-wrapper {
			position: relative;
			width: 48px;
			height: 48px;
			flex-shrink: 0;
		}

		.result-image {
			display: block;
			width: 100%;
			height: 100%;
			object-fit: cover;
			border-radius: $item-corner-small;
			border: 1px solid var(--border-primary);
		}

		.result-info {
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: $unit-half;
			min-width: 0;
		}

		.result-name {
			font-size: $font-regular;
			color: var(--text-primary);
		}

		.result-labels {
			display: flex;
			align-items: center;
			gap: $unit-half;
		}
	}

	.footer {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit-2x;
		position: relative;
		z-index: 1;
		transition: box-shadow 0.2s ease;

		&.scrolled {
			box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08);

			:global(html[data-theme='dark']) & {
				box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
			}
		}
	}

	.footer-spacer {
		flex: 1;
	}
</style>
