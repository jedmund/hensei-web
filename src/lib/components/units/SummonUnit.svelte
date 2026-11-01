<script lang="ts">
	import type { GridSummon } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import { page } from '$app/stores'
	import Icon from '$lib/components/Icon.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import RemoveUnitDialog from './RemoveUnitDialog.svelte'
	import SubstituteCountBadge from './SubstituteCountBadge.svelte'
	import BookmarkOverlay from './BookmarkOverlay.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getSummonImage } from '$lib/features/database/detail/image'
	import { getPlaceholderImage, getSummonTransformation } from '$lib/utils/images'
	import { seriesHasUlbArt } from '$lib/utils/summonSeries'
	import {
		openDetailsSidebar,
		openSummonEditSidebar
	} from '$lib/features/details/openDetailsSidebar.svelte'
	import { canAccessDatabase } from '$lib/utils/database'
	import { getElementClassName } from '$lib/utils/element'
	import { GridType } from '$lib/types/enums'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import DuplicateCollectionDialog from '$lib/components/dialogs/DuplicateCollectionDialog.svelte'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { useUnitActions } from './useUnitActions.svelte'
	import { useUnitDuplicate } from './useUnitDuplicate.svelte'
	import quickSummonFilled from '$src/assets/icons/quick-summon/filled.svg'
	import quickSummonEmpty from '$src/assets/icons/quick-summon/empty.svg'
	import SealOverlay from '$lib/components/solomonis/grid/SealOverlay.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import SealMenuItems from '$lib/components/solomonis/grid/SealMenuItems.svelte'
	import { nextSealState, writeSealState } from '$lib/components/solomonis/grid/sealActions'
	import {
		FRIEND_SUMMON_POSITION,
		getExpedition,
		slotSeal
	} from '$lib/components/solomonis/grid/seal'

	interface Props {
		item?: GridSummon | undefined
		position: number
		notInCollection?: boolean
		inCollection?: boolean
		sizeOverride?: 'main' | 'grid' | undefined
		/** Shows the slot greyed out and closed to edits (the support summon in Arcarum) */
		disabled?: boolean
		/** Explains a disabled slot on hover */
		disabledTooltip?: string | undefined
	}

	let {
		item,
		position,
		notInCollection = false,
		inCollection = false,
		sizeOverride = undefined,
		disabled = false,
		disabledTooltip = undefined
	}: Props = $props()

	const ctx = usePartyContext()
	const actions = useUnitActions({
		type: 'summon',
		ctx,
		item: () => item,
		position: () => position,
		entity: () => item?.summon
	})
	const { remove, replace } = actions
	const duplicate = useUnitDuplicate({
		type: 'summon',
		ctx,
		item: () => item,
		allowed: () => position !== 6,
		linkedToCollection: () => !!item?.collectionSummonId
	})

	// Evoking Solomonis: seal state (no support summon in the mode)
	let seal = $derived.by(() => {
		const expedition = getExpedition(ctx?.getParty())
		if (!expedition || position === FRIEND_SUMMON_POSITION) return null
		return slotSeal(expedition, 'summon', position, item)
	})

	// Editors mark a non-starting item sealed or unsealed from the lock or the menu
	let canToggleSeal = $derived(!!item && !!seal?.editable && !!ctx?.canEdit())

	function toggleSeal() {
		if (!item || !seal || !ctx) return
		void writeSealState(ctx, 'summon', item, nextSealState(seal.state))
	}

	// A disabled slot can't be picked or edited
	let canEditSlot = $derived(!disabled && !!ctx?.canEdit())

	// Use position (not data flags) to determine sizing — position is authoritative
	let isMainSized = $derived(
		sizeOverride ? sizeOverride === 'main' : position === -1 || position === 6
	)

	let imageUrl = $derived.by(() => {
		const variant = isMainSized ? 'main' : 'grid'
		const transformation = getSummonTransformation(
			item?.summon?.granblueId,
			item?.uncapLevel,
			item?.transcendenceStep,
			seriesHasUlbArt(item?.summon?.series)
		)
		return getSummonImage(item?.summon?.granblueId, variant, transformation)
	})

	let isActive = $derived(actions.isActive)

	// Check if this slot is currently selected for adding/replacing an item
	let isSelected = $derived(
		ctx?.getSelectedSlot?.() === position && ctx?.getActiveTab?.() === GridType.Summon
	)

	// Determine element class for focus ring
	let elementClass = $derived(getElementClassName(item?.summon?.element))

	function viewDetails() {
		if (!item) return
		const party = ctx.getParty()
		openDetailsSidebar({
			type: 'summon',
			item,
			isOwner: ctx?.canEdit() ?? false,
			onReplace: ctx?.canEdit() ? replace : undefined,
			onRemove: ctx?.canEdit() ? remove : undefined,
			partyId: party?.id,
			partyShortcode: party?.shortcode
		})
	}

	function editItem() {
		if (!item) return
		const party = ctx.getParty()
		openSummonEditSidebar(item, {
			partyId: party?.id,
			partyShortcode: party?.shortcode
		})
	}

	// Quick summon badge — visible on main and grid positions, not friend or subaura
	let showQuickSummon = $derived(item && position !== undefined && position < 4)

	async function toggleQuickSummon(e: MouseEvent) {
		e.stopPropagation()
		if (!item?.id || !ctx?.canEdit()) return
		try {
			await ctx.services.gridService.updateQuickSummon(item.id, !item.quickSummon)
		} catch (err) {
			console.error('Error toggling quick summon:', err)
			toast.error(extractErrorMessage(err, 'Failed to update quick summon'))
		}
	}

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))
</script>

<div
	class="unit {elementClass}"
	class:empty={!item}
	class:is-active={isActive}
	class:orphaned={item?.orphaned}
>
	{#if item}
		<UnitMenuContainer showGearButton={true} gearPosition="top-right">
			{#snippet trigger()}
				<div
					class="focus-ring-wrapper {elementClass}"
					class:is-active={isActive}
					class:editable={ctx?.canEdit()}
				>
					{#key item?.id ?? position}
						<div
							class="frame summon {elementClass}"
							class:main={isMainSized && position === -1}
							class:friend={isMainSized && position === 6}
							class:cell={!isMainSized}
							class:editable={ctx?.canEdit()}
							class:is-active={isActive}
							class:is-selected={isSelected}
							class:not-in-collection={notInCollection}
							role="button"
							tabindex="0"
							onclick={() => viewDetails()}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault()
									viewDetails()
								}
							}}
						>
							{#if item?.orphaned}
								<div class="orphaned-badge" title={m.tooltip_not_in_collection()}>
									<Icon name="alertTriangle" size={16} />
								</div>
							{/if}
							<img
								class="image {elementClass}"
								class:placeholder={!item?.summon?.granblueId}
								class:not-in-collection={notInCollection}
								alt={localizedName(item?.summon?.name)}
								src={imageUrl}
							/>
							{#if seal}
								<SealOverlay
									{seal}
									filled={true}
									onToggle={canToggleSeal ? toggleSeal : undefined}
								/>
							{/if}
						</div>
					{/key}
					{#if inCollection}
						<BookmarkOverlay element={item?.summon?.element} />
					{/if}
					{#if showQuickSummon && ctx?.canEdit()}
						<button
							class="quick-summon"
							class:active={item?.quickSummon}
							class:main={position === -1}
							onclick={toggleQuickSummon}
						>
							<img
								class="quick-summon-icon filled"
								src={quickSummonFilled}
								alt={m.details_quick_summon()}
							/>
							<img
								class="quick-summon-icon empty"
								src={quickSummonEmpty}
								alt={m.details_quick_summon()}
							/>
						</button>
					{:else if item?.quickSummon}
						<img
							class="quick-summon static"
							class:main={position === -1}
							src={quickSummonFilled}
							alt={m.details_quick_summon()}
						/>
					{/if}
				</div>
			{/snippet}

			{#snippet menu(variant: 'context' | 'dropdown')}
				<MenuItems
					{variant}
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? actions.viewInDatabase : undefined}
					onViewTeams={actions.viewTeams}
					onAddToTeamsView={actions.isTeamsPaneOpen ? actions.addToTeamsView : undefined}
					onEdit={ctx?.canEdit() ? editItem : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onDuplicate={ctx?.canEdit() ? duplicate.duplicate : undefined}
					duplicateDisabled={!duplicate.canDuplicate || duplicate.busy}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					editLabel={m.context_edit({ type: m.type_summon() })}
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					viewTeamsLabel={m.context_view_teams_summon()}
					addToTeamsViewLabel={m.context_add_to_teams_view()}
					replaceLabel={m.context_replace({ type: m.type_summon() })}
					duplicateLabel={m.context_duplicate({ type: m.type_summon() })}
					removeLabel={m.context_remove()}
					editExtras={canToggleSeal ? sealMenuItems : undefined}
				/>
				{#snippet sealMenuItems()}
					{#if item && seal}
						<SealMenuItems {variant} type="summon" {item} {seal} />
					{/if}
				{/snippet}
			{/snippet}
		</UnitMenuContainer>
	{:else}
		{#key `empty-${position}`}
			{#if disabled && disabledTooltip}
				<Tooltip content={disabledTooltip} class="disabled-trigger">
					{@render emptyFrame()}
				</Tooltip>
			{:else}
				{@render emptyFrame()}
			{/if}
		{/key}
		{#snippet emptyFrame()}
			<div
				class="frame summon"
				class:main={isMainSized && position === -1}
				class:friend={isMainSized && position === 6}
				class:cell={!isMainSized}
				class:editable={canEditSlot}
				class:disabled
				class:is-selected={isSelected}
				role="button"
				tabindex={disabled ? -1 : 0}
				aria-disabled={disabled}
				onclick={() =>
					canEditSlot && ctx?.openPicker && ctx.openPicker({ type: 'summon', position, item })}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						if (canEditSlot && ctx?.openPicker) ctx.openPicker({ type: 'summon', position, item })
					}
				}}
			>
				<img
					class="image placeholder"
					alt=""
					src={getPlaceholderImage('summon', position === -1 || position === 6 ? 'main' : 'grid')}
				/>
				{#if seal}
					<SealOverlay {seal} filled={false} />
				{/if}
				{#if canEditSlot}
					<span class="icon">
						<Icon name="plus" size={24} />
					</span>
				{/if}
			</div>
		{/snippet}
	{/if}
	{#if item}
		<UncapIndicator
			type="summon"
			uncapLevel={item.uncapLevel}
			transcendenceStage={item.transcendenceStep}
			flb={item.summon?.uncap?.flb}
			ulb={item.summon?.uncap?.ulb}
			transcendence={item.summon?.uncap?.transcendence}
			editable={ctx?.canEdit()}
			updateUncap={actions.updateUncap}
			updateTranscendence={actions.updateTranscendence}
		/>
	{/if}
	<div class="name" class:not-in-collection={notInCollection}>
		<span class="name-text">{item ? localizedName(item?.summon?.name) : ''}</span>
		{#if item}
			<SubstituteCountBadge
				count={item.substitutions?.length ?? 0}
				element={item.summon?.element}
			/>
		{/if}
	</div>
</div>

<DuplicateCollectionDialog
	bind:open={duplicate.dialogOpen}
	onConfirm={async () => {
		duplicate.dialogOpen = false
		await duplicate.run()
	}}
	onCancel={() => {
		duplicate.dialogOpen = false
	}}
/>

<RemoveUnitDialog
	bind:open={actions.removeConfirmOpen}
	type="summon"
	name={item?.summon ? localizedName(item.summon.name) : null}
	onConfirm={actions.removeAction.run}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/rep' as rep;
	@use '$src/themes/unit' as unit;

	@include unit.unit-root;
	@include unit.unit-slot;

	.focus-ring-wrapper.editable:hover {
		transform: scale(1.05);
	}

	.frame {
		overflow: hidden;

		&.disabled {
			opacity: 0.4;
			cursor: default;
		}
	}

	.frame.summon.main,
	.frame.summon.friend {
		@include rep.aspect(rep.$summon-main-w, rep.$summon-main-h);
	}

	.frame.summon.cell {
		@include rep.aspect(rep.$summon-cell-w, rep.$summon-cell-h);
	}

	@include unit.unit-orphaned-badge;

	.quick-summon {
		top: -2%;
		right: 28%;
		width: spacing.$unit-5x;
		height: spacing.$unit-5x;

		&.main {
			width: spacing.$unit-6x;
			height: spacing.$unit-6x;
		}
	}

	@include unit.unit-toggle-badge(quick-summon);

	@include unit.unit-shared-styles;

	// The tooltip's trigger wraps the disabled slot; keep it the slot's width
	:global(.disabled-trigger) {
		display: block;
		width: 100%;
	}
</style>
