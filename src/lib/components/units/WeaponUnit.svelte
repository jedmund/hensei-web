<script lang="ts">
	import type { GridWeapon } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import { page } from '$app/stores'
	import { goto } from '$app/navigation'
	import Icon from '$lib/components/Icon.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getWeaponImage } from '$lib/features/database/detail/image'
	import { getPlaceholderImage, getWeaponTransformation } from '$lib/utils/images'
	import { openDetailsSidebar, openWeaponEditSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { canWeaponBeModified } from '$lib/utils/modificationDetector'
	import { getDatabaseUrl, canAccessDatabase } from '$lib/utils/database'
	import { getAwakeningImage, getWeaponKeyImages, getAxSkillImages } from '$lib/utils/modifiers'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import { GridType } from '$lib/types/enums'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import DuplicateCollectionDialog from '$lib/components/dialogs/DuplicateCollectionDialog.svelte'
	import { findNextEmptySlot, SLOT_NOT_FOUND } from '$lib/utils/gridHelpers'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'

	interface Props {
		item?: GridWeapon | undefined
		position: number
		notInCollection?: boolean
		inCollection?: boolean
	}

	let { item, position, notInCollection = false, inCollection = false }: Props = $props()

	const ctx = usePartyContext()

	// Use $derived to ensure consistent computation between server and client
	let imageUrl = $derived.by(() => {
		const isMain = position === -1 || item?.mainhand
		const variant = isMain ? 'main' : 'grid'

		// For element-changeable weapons (element === 0), use instance element.
		// Mainhand images don't have a null-element variant, so default to fire (2).
		const element = item?.weapon?.element === 0 ? (item?.element ?? (isMain ? 2 : 0)) : undefined
		const transformation = getWeaponTransformation(item?.weapon?.uncap?.transcendence, item?.uncapLevel, item?.transcendenceStep)

		return getWeaponImage(item?.weapon?.granblueId, variant, element, transformation, item?.weapon?.elementVariantIds)
	})

	// Get awakening image URL using utility
	let awakeningImage = $derived(getAwakeningImage(item?.awakening))

	// Get weapon key images using utility
	let weaponKeyImages = $derived(getWeaponKeyImages(item?.weaponKeys, item?.weapon?.proficiency))

	// Get AX skill images using utility
	let axSkillImages = $derived(getAxSkillImages(item?.ax))

	// Check if this item is currently active in the sidebar
	let isActive = $derived(item?.id && sidebar.activeItemId === String(item.id))

	// Check if this slot is currently selected for adding/replacing an item
	let isSelected = $derived(
		ctx?.getSelectedSlot?.() === position &&
			ctx?.getActiveTab?.() === GridType.Weapon
	)

	// Determine element class for focus ring
	let elementClass = $derived.by(() => {
		// For weapons with null element that have an instance element, use it
		const element =
			item?.weapon?.element === 0 && item?.element ? item.element : item?.weapon?.element

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
			await ctx.services.gridService.removeWeapon(
				party.id,
				item.id as any,
				editKey || undefined
			)
		} catch (err) {
			console.error('Error removing weapon:', err)
			toast.error(extractErrorMessage(err, 'Failed to remove weapon'))
		}
	}

	let canEditItem = $derived(canWeaponBeModified(item))

	function getSaveCallback() {
		return async (id: string, updates: Partial<GridWeapon>) => {
			const party = ctx.getParty()
			await ctx.services.gridService.updateWeapon(party.id, id, updates)
		}
	}

	function viewDetails() {
		if (!item) return
		openDetailsSidebar({
			type: 'weapon',
			item,
			onSaveWeapon: getSaveCallback()
		})
	}

	function editItem() {
		if (!item) return
		openWeaponEditSidebar(item, getSaveCallback())
	}

	function replace() {
		if (ctx?.openPicker) {
			ctx.openPicker({ type: 'weapon', position, item })
		}
	}

	function viewInDatabase() {
		if (!item?.weapon?.granblueId) return
		goto(getDatabaseUrl('weapon', item.weapon.granblueId))
	}

	// Duplicate: find the first empty sub-weapon slot (0-8)
	let firstEmptySlot = $derived.by(() => {
		const party = ctx.getParty()
		const occupied = new Set(
			party.weapons?.filter((w) => w.position >= 0 && w.position < 9).map((w) => w.position) ?? []
		)
		for (let i = 0; i < 9; i++) {
			if (!occupied.has(i)) return i
		}
		return undefined
	})

	let canDuplicate = $derived(
		!!item && firstEmptySlot !== undefined && !item.weapon?.limit
	)

	let duplicateCollectionDialogOpen = $state(false)

	async function duplicate() {
		if (!item?.id || firstEmptySlot === undefined) return
		if (item.collectionWeaponId) {
			duplicateCollectionDialogOpen = true
			return
		}
		await executeDuplicate()
	}

	async function executeDuplicate() {
		if (!item?.id || firstEmptySlot === undefined) return
		try {
			await ctx.services.gridService.duplicateWeapon(item.id, firstEmptySlot)
			const nextSlot = findNextEmptySlot(ctx.getParty(), GridType.Weapon, firstEmptySlot)
			if (nextSlot !== SLOT_NOT_FOUND) {
				ctx.setSelectedSlot?.(nextSlot)
			}
		} catch (err) {
			console.error('Error duplicating weapon:', err)
			toast.error(extractErrorMessage(err, 'Failed to duplicate weapon'))
		}
	}

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))
</script>

<div
	class="unit {elementClass}"
	class:empty={!item}
	class:extra={position >= 9}
	class:is-active={isActive}
	class:orphaned={item?.orphaned}
>
	{#if item}
		<UnitMenuContainer showGearButton={true}>
			{#snippet trigger()}
				<div
					class="focus-ring-wrapper {elementClass}"
					class:is-active={isActive}
					class:editable={ctx?.canEdit()}
					class:main={item?.mainhand || position === -1}
				>
					{#key item?.id ?? position}
						<div
							class="frame weapon {elementClass}"
							class:main={item?.mainhand || position === -1}
							class:cell={!(item?.mainhand || position === -1)}
							class:extra={position >= 9}
							class:editable={ctx?.canEdit()}
							class:is-active={isActive}
							class:is-selected={isSelected}
							class:not-in-collection={notInCollection}
							onclick={() => viewDetails()}
						>
							<div class="modifiers">
								{#if item?.orphaned}
									<div class="orphaned-badge" title={m.tooltip_not_in_collection()}>
										<Icon name="alertTriangle" size={16} />
									</div>
								{/if}
								{#if awakeningImage}
									<img
										class="awakening"
										src={awakeningImage}
										alt={`${localizedName(item?.awakening?.type?.name)} Lv${item?.awakening?.level || 0}`}
									/>
								{/if}
								<div class="skills">
									{#each axSkillImages as skill}
										<img class="skill" src={skill.url} alt={skill.alt} />
									{/each}
									{#each weaponKeyImages as skill}
										<Tooltip content={skill.alt}>
											<img class="skill" src={skill.url} alt={skill.alt} />
										</Tooltip>
									{/each}
								</div>
							</div>
							<img
								class="image {elementClass}"
								class:placeholder={!item?.weapon?.granblueId}
								class:not-in-collection={notInCollection}
								alt={localizedName(item?.weapon?.name)}
								src={imageUrl}
							/>
						</div>
					{/key}
				</div>
			{/snippet}

			{#snippet contextMenu()}
				<MenuItems
					onEdit={canEditItem ? editItem : undefined}
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? viewInDatabase : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onDuplicate={ctx?.canEdit() ? duplicate : undefined}
					duplicateDisabled={!canDuplicate}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="context"
					editLabel={m.context_edit({ type: m.type_weapon() })}
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					replaceLabel={m.context_replace({ type: m.type_weapon() })}
					duplicateLabel={m.context_duplicate({ type: m.type_weapon() })}
					removeLabel={m.context_remove()}
				/>
			{/snippet}

			{#snippet dropdownMenu()}
				<MenuItems
					onEdit={canEditItem ? editItem : undefined}
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? viewInDatabase : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onDuplicate={ctx?.canEdit() ? duplicate : undefined}
					duplicateDisabled={!canDuplicate}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					variant="dropdown"
					editLabel={m.context_edit({ type: m.type_weapon() })}
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					replaceLabel={m.context_replace({ type: m.type_weapon() })}
					duplicateLabel={m.context_duplicate({ type: m.type_weapon() })}
					removeLabel={m.context_remove()}
				/>
			{/snippet}
		</UnitMenuContainer>
	{:else}
		{#key `empty-${position}`}
			<div
				class="frame weapon"
				class:main={position === -1}
				class:cell={position !== -1}
				class:extra={position >= 9}
				class:editable={ctx?.canEdit()}
				class:is-selected={isSelected}
				onclick={() =>
					ctx?.canEdit() && ctx?.openPicker && ctx.openPicker({ type: 'weapon', position, item })}
			>
				<img
					class="image placeholder"
					alt=""
					src={getPlaceholderImage('weapon', position === -1 ? 'main' : 'grid')}
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
			type="weapon"
			uncapLevel={item.uncapLevel}
			transcendenceStage={item.transcendenceStep}
			flb={item.weapon?.uncap?.flb}
			ulb={item.weapon?.uncap?.ulb}
			transcendence={item.weapon?.uncap?.transcendence}
			editable={ctx?.canEdit()}
			minUncapLevel={position >= 9 ? item.weapon?.uncap?.extraPrerequisite ?? undefined : undefined}
			updateUncap={async (level) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					await ctx.services.gridService.updateWeaponUncap(
						item.id,
						level,
						undefined,
						editKey || undefined
					)
				} catch (err) {
					console.error('Failed to update weapon uncap:', err)
					toast.error(extractErrorMessage(err, 'Failed to update uncap level'))
				}
			}}
			updateTranscendence={async (stage) => {
				if (!item?.id || !ctx) return
				try {
					const editKey = ctx.getEditKey()
					// When setting transcendence > 0, also set uncap to max (6)
					const maxUncap = stage > 0 ? 6 : undefined
					await ctx.services.gridService.updateWeaponUncap(
						item.id,
						maxUncap,
						stage,
						editKey || undefined
					)
				} catch (err) {
					console.error('Failed to update weapon transcendence:', err)
					toast.error(extractErrorMessage(err, 'Failed to update transcendence'))
				}
			}}
		/>
	{/if}
	<div class="name" class:not-in-collection={notInCollection}>
		{#if item && inCollection}<Icon name="bookmark" width={12} height={16} />{/if}
		{item ? localizedName(item?.weapon?.name) : ''}
	</div>
</div>

<DuplicateCollectionDialog
	bind:open={duplicateCollectionDialogOpen}
	onConfirm={async () => {
		duplicateCollectionDialogOpen = false
		await executeDuplicate()
	}}
	onCancel={() => {
		duplicateCollectionDialogOpen = false
	}}
/>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/rep' as rep;
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

		&.extra {
			.frame {
				background: var(--extra-purple-card-bg);
			}

			.icon {
				color: var(--extra-purple-secondary);
			}

			&:hover .icon {
				color: var(--extra-purple-primary);
			}

			.name {
				font-weight: typography.$medium;
				color: var(--extra-purple-text);
			}
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
			transform: layout.$scale-wide;
		}

		&.editable.main:hover {
			transform: layout.$scale-tall;
		}
	}

	.frame {
		position: relative;
		width: 100%;
		overflow: hidden;
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

	.frame.weapon.main {
		@include rep.aspect(rep.$weapon-main-w, rep.$weapon-main-h);
	}

	.frame.weapon.cell {
		@include rep.aspect(rep.$weapon-cell-w, rep.$weapon-cell-h);
	}

	.image {
		position: relative;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		z-index: effects.$z-badge;

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

	}

	.modifiers {
		position: absolute;
		width: 100%;
		height: 100%;
		z-index: effects.$z-sticky;
		pointer-events: none;

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

		.awakening {
			position: absolute;
			width: 30%;
			height: auto;
		}

		.skills {
			position: absolute;
			display: flex;
			gap: calc(spacing.$unit / 4);
			padding: calc(spacing.$unit / 2);
			pointer-events: auto;

			:global(span) {
				display: flex;
			}

			.skill {
				width: 30px;
				height: 30px;
			}
		}
	}

	// Orphaned state
	.unit.orphaned {
		.frame {
			border: 2px solid colors.$error;
		}

		.frame .image {
			opacity: 0.7;
		}

		.name {
			color: colors.$error;
		}
	}

	// Position modifiers for grid weapons
	.frame.weapon.cell {
		.awakening {
			top: 14%;
			left: -3.5%;
		}

		.skills {
			bottom: 2%;
			right: 2%;
			justify-content: flex-end;
		}
	}

	// Position modifiers for main weapons
	.frame.weapon.main {
		.awakening {
			width: 40%;
			top: 67%;
			left: -3.5%;
		}

		.skills {
			bottom: 1%;
			left: auto;
			right: 2%;
			justify-content: flex-end;

			.skill {
				width: 38px;
				height: 38px;
			}
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
</style>
