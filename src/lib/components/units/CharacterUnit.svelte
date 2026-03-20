<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import Icon from '$lib/components/Icon.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import { getCharacterImageWithPose, getPlaceholderImage } from '$lib/utils/images'
	import { openDetailsSidebar, openCharacterEditSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { canCharacterBeModified } from '$lib/utils/modificationDetector'
	import { getDatabaseUrl, canAccessDatabase } from '$lib/utils/database'
	import { getElementKey } from '$lib/utils/element'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import PartiesPane from '$lib/components/sidebar/PartiesPane.svelte'
	import { collectionTeamsPane } from '$lib/stores/collectionTeamsPane.svelte'
	import type { ElementType } from '$lib/stores/paneStack.svelte'
	import type { FilterItem } from '$lib/components/explore/ExploreFilters.svelte'
	import { GridType } from '$lib/types/enums'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'
	import perpetuityEmpty from '$src/assets/icons/perpetuity/empty.svg'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		item?: GridCharacter | undefined
		position: number
		mainWeaponElement?: number | null | undefined
		partyElement?: number | null | undefined
		notInCollection?: boolean
		inCollection?: boolean
	}

	let { item, position, mainWeaponElement, partyElement, notInCollection = false, inCollection = false }: Props = $props()

	const ctx = usePartyContext()

	// Use $derived to ensure consistent computation between server and client
	let imageUrl = $derived.by(() => {
		// If no item or no character with granblueId, return placeholder
		if (!item || !item.character?.granblueId) {
			return getCharacterImageWithPose(null, 'main', 0, 0)
		}

		return getCharacterImageWithPose(
			item.character.granblueId,
			'main',
			item?.uncapLevel ?? 0,
			item?.transcendenceStep ?? 0,
			mainWeaponElement,
			partyElement,
			item.character.styleSwap
		)
	})

	// Check if this item is currently active in the sidebar
	let isActive = $derived(item?.id && sidebar.activeItemId === String(item.id))

	// Check if this empty slot is currently selected for adding an item
	let isEmptySelected = $derived(
		!item &&
			ctx?.getSelectedSlot?.() === position &&
			ctx?.getActiveTab?.() === GridType.Character
	)

	// Determine element class for focus ring
	let elementClass = $derived.by(() => {
		const element = item?.character?.element || partyElement

		switch (element) {
			case 1:
				return 'wind'
			case 2:
				return 'fire'
			case 3:
				return 'water'
			case 4:
				return 'earth'
			case 5:
				return 'dark'
			case 6:
				return 'light'
			default:
				return 'neutral'
		}
	})

	async function remove() {
		if (!item?.id) return
		try {
			const party = ctx.getParty()
			const editKey = ctx.getEditKey()
			await ctx.services.gridService.removeCharacter(
				party.id,
				item.id as any,
				editKey || undefined
			)
		} catch (err) {
			console.error('Error removing character:', err)
			toast.error(extractErrorMessage(err, 'Failed to remove character'))
		}
	}

	let canEditItem = $derived(canCharacterBeModified(item))

	function getSaveCallback() {
		return async (id: string, updates: Partial<GridCharacter>) => {
			const party = ctx.getParty()
			await ctx.services.gridService.updateCharacter(party.id, id, updates)
		}
	}

	function viewDetails() {
		if (!item) return
		openDetailsSidebar({
			type: 'character',
			item,
			onSaveCharacter: getSaveCallback()
		})
	}

	function editItem() {
		if (!item) return
		openCharacterEditSidebar(item, getSaveCallback())
	}

	function replace() {
		if (ctx?.openPicker) {
			ctx.openPicker({ type: 'character', position, item })
		}
	}

	function viewInDatabase() {
		if (!item?.character?.granblueId) return
		goto(getDatabaseUrl('character', item.character.granblueId, item.character.styleSwap))
	}

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

	// Teams pane state
	let isTeamsPaneOpen = $derived(collectionTeamsPane.isOpen)

	function viewTeamsWithCharacter() {
		if (!item?.character) return
		const charData = item.character
		const entityFilter: FilterItem = {
			kind: 'entity',
			value: charData.granblueId,
			label: localizedName(charData.name) ?? charData.granblueId,
			entityType: 'character',
			granblueId: charData.granblueId,
			mode: 'include',
			element: charData.element,
			pinned: true
		}
		collectionTeamsPane.reset(entityFilter)
		const name = localizedName(charData.name)
		const elementName = charData.element ? getElementKey(charData.element) as ElementType : undefined
		sidebar.openWithComponent(name, PartiesPane, {
			pinnedFilters: [entityFilter],
			defaultElement: charData.element,
			useCollectionTeamsStore: true,
			resetKey: charData.granblueId
		}, { scrollable: true, element: elementName })
	}

	function addCharacterToTeamsView() {
		if (!item?.character) return
		const charData = item.character
		collectionTeamsPane.addEntity({
			kind: 'entity',
			value: charData.granblueId,
			label: localizedName(charData.name) ?? charData.granblueId,
			entityType: 'character',
			granblueId: charData.granblueId,
			mode: 'include',
			element: charData.element
		})
	}

	// Check if character has a style swap variant available
	let hasStyleVariant = $derived.by(() => {
		if (!item?.character) return false
		const c = item.character
		// Base character with style swaps, or style swap character with a base
		return (c.styleSwaps && c.styleSwaps.length > 0) || (c.styleSwap && c.baseCharacter != null)
	})

	async function switchStyle(e: Event) {
		e.stopPropagation()
		if (!item?.id || !ctx?.canEdit()) return

		try {
			const editKey = ctx.getEditKey()
			await ctx.services.gridService.switchCharacterStyle(
				item.id,
				editKey || undefined
			)
		} catch (err) {
			console.error('Error switching style:', err)
			toast.error(extractErrorMessage(err, 'Failed to switch style'))
		}
	}

	async function togglePerpetuity(e: Event) {
		e.stopPropagation()
		if (!item?.id || !ctx?.canEdit()) return

		try {
			const party = ctx.getParty()
			const editKey = ctx.getEditKey()
			await ctx.services.gridService.updateCharacter(
				party.id,
				item.id,
				{ perpetuity: !item.perpetuity },
				editKey || undefined
			)
		} catch (err) {
			console.error('Error toggling perpetuity:', err)
			toast.error(extractErrorMessage(err, 'Failed to toggle perpetuity'))
		}
	}
</script>

<div class="unit {elementClass}" class:empty={!item} class:is-active={isActive} class:orphaned={item?.orphaned}>
	{#if item}
		<UnitMenuContainer showGearButton={true}>
			{#snippet trigger()}
				<div
					class="focus-ring-wrapper {elementClass}"
					class:is-active={isActive}
					class:editable={ctx?.canEdit()}
				>
					{#key item?.id ?? position}
						<div
							class="frame character cell {elementClass}"
							class:editable={ctx?.canEdit()}
							class:is-active={isActive}
							class:not-in-collection={notInCollection}
							onclick={() => viewDetails()}
						>
							{#if ctx?.canEdit()}
								<button
									class="perpetuity"
									class:active={item.perpetuity}
									onclick={togglePerpetuity}
									title={item.perpetuity ? m.tooltip_remove_perpetuity_ring() : m.tooltip_add_perpetuity_ring()}
								>
									<img
										class="perpetuity-icon filled"
										src={perpetuityFilled}
										alt={m.label_perpetuity_ring()}
									/>
									<img
										class="perpetuity-icon empty"
										src={perpetuityEmpty}
										alt={m.tooltip_add_perpetuity_ring()}
									/>
								</button>
							{:else if item.perpetuity}
								<img
									class="perpetuity static"
									src={perpetuityFilled}
									alt={m.label_perpetuity_ring()}
									title={m.label_perpetuity_ring()}
								/>
							{/if}
							{#if item?.orphaned}
								<div class="orphaned-badge" title={m.tooltip_not_in_collection()}>
									<Icon name="alertTriangle" size={16} />
								</div>
							{/if}
							{#if hasStyleVariant && ctx?.canEdit()}
								<span class="style-switch-wrapper">
									<Tooltip content="Swap styles">
										<button
											class="style-switch"
											onclick={switchStyle}
										>
											<Icon name="swap" size={14} />
										</button>
									</Tooltip>
								</span>
							{/if}
							{#if imageUrl}
								<img
									class="image {elementClass}"
									class:placeholder={!item?.character?.granblueId}
									class:not-in-collection={notInCollection}
									alt={localizedName(item?.character?.name)}
									src={imageUrl}
								/>
							{/if}
						</div>
					{/key}
				</div>
			{/snippet}

			{#snippet contextMenu()}
				<MenuItems
					onEdit={canEditItem ? editItem : undefined}
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? viewInDatabase : undefined}
					onViewTeams={viewTeamsWithCharacter}
					onAddToTeamsView={isTeamsPaneOpen ? addCharacterToTeamsView : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="context"
					editLabel={m.context_edit({ type: m.type_character() })}
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					viewTeamsLabel={m.context_view_teams_character()}
					addToTeamsViewLabel={m.context_add_to_teams_view()}
					replaceLabel={m.context_replace({ type: m.type_character() })}
					removeLabel={m.context_remove()}
				/>
			{/snippet}

			{#snippet dropdownMenu()}
				<MenuItems
					onEdit={canEditItem ? editItem : undefined}
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? viewInDatabase : undefined}
					onViewTeams={viewTeamsWithCharacter}
					onAddToTeamsView={isTeamsPaneOpen ? addCharacterToTeamsView : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="dropdown"
					editLabel={m.context_edit({ type: m.type_character() })}
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					viewTeamsLabel={m.context_view_teams_character()}
					addToTeamsViewLabel={m.context_add_to_teams_view()}
					replaceLabel={m.context_replace({ type: m.type_character() })}
					removeLabel={m.context_remove()}
				/>
			{/snippet}
		</UnitMenuContainer>
	{:else}
		{#key `empty-${position}`}
			<div
				class="frame character cell"
				class:editable={ctx?.canEdit()}
				class:is-selected={isEmptySelected}
				onclick={() =>
					ctx?.canEdit() &&
					ctx?.openPicker &&
					ctx.openPicker({ type: 'character', position, item })}
			>
				<img
					class="image placeholder"
					alt=""
					src={getPlaceholderImage('character', 'grid')}
				/>
				{#if ctx?.canEdit()}
					<span class="icon">
						<Icon name="plus" size={24} />
					</span>
				{/if}
			</div>
		{/key}
	{/if}
	{#if item}
		<UncapIndicator
			type="character"
			uncapLevel={item.uncapLevel}
			transcendenceStage={item.transcendenceStep}
			special={item.character?.special}
			flb={item.character?.uncap?.flb}
			ulb={item.character?.uncap?.transcendence}
			transcendence={item.character?.uncap?.transcendence}
			editable={ctx?.canEdit()}
			updateUncap={async (level) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					await ctx.services.gridService.updateCharacterUncap(
						item.id,
						level,
						undefined,
						editKey || undefined
					)
				} catch (err) {
					console.error('Failed to update character uncap:', err)
					toast.error(extractErrorMessage(err, 'Failed to update uncap level'))
				}
			}}
			updateTranscendence={async (stage) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					// When setting transcendence > 0, also set uncap to max (6)
					const maxUncap = stage > 0 ? 6 : undefined
					await ctx.services.gridService.updateCharacterUncap(
						item.id,
						maxUncap,
						stage,
						editKey || undefined
					)
				} catch (err) {
					console.error('Failed to update character transcendence:', err)
					toast.error(extractErrorMessage(err, 'Failed to update transcendence'))
				}
			}}
		/>
	{/if}
	<div class="name" class:not-in-collection={notInCollection}>
		{#if item && inCollection}<Icon name="bookmark" width={12} height={16} />{/if}
		{item ? localizedName(item?.character?.name) : ''}
		{#if item?.artifact}
			<Icon name="gem" size={12} class="artifact-indicator" />
		{/if}
	</div>
	{#if item?.character}
		<CharacterTags character={item.character} />
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/rep' as rep;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	.unit {
		position: relative;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: spacing.$unit;

		&.empty .name {
			display: none;
		}
	}

	.focus-ring-wrapper {
		position: relative;
		display: block;
		transition: transform 0.2s ease-in-out;

		&::before {
			content: '';
			position: absolute;
			inset: 0;
			border-radius: layout.$input-corner;
			pointer-events: none;
			z-index: effects.$z-sticky;
		}

		&.editable:hover {
			transform: scale(1.05);
		}
	}

	.frame {
		position: relative;
		width: 100%;
		border-radius: layout.$input-corner;
		background: var(--card-bg, #f5f5f5);
		transition: opacity 0.2s ease-in-out;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;

		&.editable:hover {
			opacity: 0.95;
			box-shadow: var(--shadow-sm);
		}

		// Slot selection - subtle dark pulsing glow (works for both empty and filled)
		&.is-selected,
		&.is-active {
			animation: pulse-slot-shadow 2s ease-in-out infinite;
		}
	}

	@keyframes pulse-slot-shadow {
		0%,
		100% {
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.12), 0 0 4px 2px rgba(0, 0, 0, 0.06);
		}
		50% {
			box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.24), 0 0 8px 4px rgba(0, 0, 0, 0.12);
		}
	}

	.frame.character.cell {
		@include rep.aspect(rep.$char-cell-w, rep.$char-cell-h);
	}

	.image {
		position: relative;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		z-index: effects.$z-badge;
		border-radius: layout.$input-corner;

		&.placeholder {
			opacity: 0;
		}

		&.not-in-collection {
			opacity: 0.7;
		}
	}

	.frame.not-in-collection::before {
		content: '';
		position: absolute;
		inset: 0;
		border: 2px solid colors.$error;
		box-shadow: inset 0px 0px 4px colors.$error;
		border-radius: inherit;
		z-index: effects.$z-badge;
		pointer-events: none;
	}

	.icon {
		position: absolute;
		z-index: effects.$z-raised;
		color: var(--icon-secondary, #999);
		transition: color 0.2s ease-in-out;
	}

	.frame.editable:hover .icon {
		color: var(--icon-secondary-hover, #666);
	}

	.name {
		font-size: typography.$font-small;
		text-align: center;
		color: var(--text-secondary);

		:global(span) {
			display: inline;
			vertical-align: -4px;
		}

		align-items: center;
		justify-content: center;
		gap: spacing.$unit-fourth;

		:global(.artifact-indicator) {
			color: var(--extra-purple-text);
			flex-shrink: 0;
		}
	}

	.perpetuity {
		position: absolute;
		z-index: effects.$z-tooltip;
		top: calc(spacing.$unit * -1);
		right: spacing.$unit-3x;
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		padding: 0;
		border: none;
		background: transparent;
		cursor: pointer;
		transition: transform 0.2s ease;

		&:not(.active) {
			display: none;
		}

		&:hover {
			transform: scale(1.1);
		}

		&.static {
			cursor: default;
			&:hover {
				transform: none;
			}
		}
	}

	.focus-ring-wrapper:hover .perpetuity:not(.active) {
		display: block;
	}

	.perpetuity-icon {
		width: 100%;
		height: 100%;
		display: block;

		&.filled {
			display: none;
		}

		&.empty {
			display: block;
		}
	}

	.perpetuity.active {
		.perpetuity-icon.filled {
			display: block;
		}

		.perpetuity-icon.empty {
			display: none;
		}

		&:hover {
			.perpetuity-icon.filled {
				display: none;
			}

			.perpetuity-icon.empty {
				display: block;
			}
		}
	}

	.perpetuity:not(.active):hover {
		.perpetuity-icon.filled {
			display: block;
		}

		.perpetuity-icon.empty {
			display: none;
		}
	}

	.style-switch-wrapper {
		position: absolute;
		z-index: effects.$z-tooltip;
		bottom: spacing.$unit;
		right: spacing.$unit;
	}

	.style-switch {
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: white;
		color: var(--text-secondary);
		box-shadow: var(--shadow-sm);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease, box-shadow 0.2s ease;

		&:hover {
			transform: scale(1.15);
			box-shadow: var(--shadow-md);
		}
	}

	// Pulsing focus ring animation
	@keyframes pulse-focus-ring {
		0%,
		100% {
			box-shadow: 0 0 4px 3px currentColor;
		}
		50% {
			box-shadow: 0 0 4px 6px currentColor;
		}
	}

	// Element-specific focus rings
	.focus-ring-wrapper.is-active::before {
		animation: pulse-focus-ring 2s ease-in-out infinite;
	}

	.focus-ring-wrapper.is-active {
		&.fire::before {
			@include colors.focus-ring-fire();
			color: rgba(250, 109, 109, 0.2);
		}

		&.water::before {
			@include colors.focus-ring-water();
			color: rgba(108, 201, 255, 0.2);
		}

		&.earth::before {
			@include colors.focus-ring-earth();
			color: rgba(253, 159, 91, 0.2);
		}

		&.wind::before {
			@include colors.focus-ring-wind();
			color: rgba(62, 228, 137, 0.2);
		}

		&.light::before {
			@include colors.focus-ring-light();
			color: rgba(232, 214, 51, 0.2);
		}

		&.dark::before {
			@include colors.focus-ring-dark();
			color: rgba(222, 123, 255, 0.2);
		}

		&.neutral::before {
			@include colors.focus-ring-neutral();
			color: rgba(0, 0, 0, 0.1);
		}
	}

	// Element-specific name colors when active
	.unit.is-active {
		.name {
			font-weight: typography.$bold;
		}

		&.fire .name {
			color: var(--fire-text);
		}

		&.water .name {
			color: var(--water-text);
		}

		&.earth .name {
			color: var(--earth-text);
		}

		&.wind .name {
			color: var(--wind-text);
		}

		&.light .name {
			color: var(--light-text);
		}

		&.dark .name {
			color: var(--dark-text);
		}

		&.neutral .name {
			color: var(--text-secondary);
		}
	}

	.orphaned-badge {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 24px;
		height: 24px;
		background: colors.$error;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		z-index: effects.$z-sticky;
		pointer-events: auto;
		cursor: help;
		box-shadow: var(--shadow-sm);
	}

	// Orphaned state
	.unit.orphaned {
		.frame {
			opacity: 0.7;
			border: 2px solid colors.$error;
		}

		.name {
			color: colors.$error;
		}
	}
</style>
