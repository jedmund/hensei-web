<script lang="ts">
	import type { GridWeapon } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import { page } from '$app/stores'
	import Icon from '$lib/components/Icon.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import RemoveUnitDialog from './RemoveUnitDialog.svelte'
	import SubstituteCountBadge from './SubstituteCountBadge.svelte'
	import BookmarkOverlay from './BookmarkOverlay.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import { getWeaponImage } from '$lib/features/database/detail/image'
	import { getPlaceholderImage, handleImageFallback } from '$lib/utils/images/core'
	import { getWeaponTransformation, getWeaponFallbackImage } from '$lib/utils/images/weapons'
	import { seriesHasTranscendenceArt } from '$lib/utils/weaponSeries'
	import {
		openDetailsSidebar,
		openWeaponEditSidebar
	} from '$lib/features/details/openDetailsSidebar.svelte'
	import { canAccessDatabase } from '$lib/utils/database'
	import { getElementClassName, ElementId } from '$lib/utils/element'
	import { skillHighlight } from '$lib/stores/skillHighlight.svelte'
	import {
		getAwakeningImage,
		getWeaponKeyImages,
		getAxSkillImages,
		getBefoulmentImages
	} from '$lib/utils/modifiers'
	import { GridType } from '$lib/types/enums'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import DuplicateCollectionDialog from '$lib/components/dialogs/DuplicateCollectionDialog.svelte'
	import { useUnitActions } from './useUnitActions.svelte'
	import { useUnitDuplicate } from './useUnitDuplicate.svelte'
	import SealOverlay from '$lib/components/solomonis/grid/SealOverlay.svelte'
	import SealMenuItems from '$lib/components/solomonis/grid/SealMenuItems.svelte'
	import { nextSealState, writeSealState } from '$lib/components/solomonis/grid/sealActions'
	import { getExpedition, slotSeal } from '$lib/components/solomonis/grid/seal'
	interface Props {
		item?: GridWeapon | undefined
		position: number
		notInCollection?: boolean
		inCollection?: boolean
	}

	let { item, position, notInCollection = false, inCollection = false }: Props = $props()

	const ctx = usePartyContext()
	const actions = useUnitActions({
		type: 'weapon',
		ctx,
		item: () => item,
		position: () => position,
		entity: () => item?.weapon
	})
	const { remove, replace } = actions
	const duplicate = useUnitDuplicate({
		type: 'weapon',
		ctx,
		item: () => item,
		allowed: () => !item?.weapon?.limit,
		linkedToCollection: () => !!item?.collectionWeaponId
	})

	// Evoking Solomonis: seal state, including the Extra slots
	let seal = $derived.by(() => {
		const expedition = getExpedition(ctx?.getParty())
		if (!expedition) return null
		return slotSeal(expedition, 'weapon', position, item)
	})

	// Editors mark a non-starting item sealed or unsealed from the lock or the menu
	let canToggleSeal = $derived(!!item && !!seal?.editable && !!ctx?.canEdit())

	function toggleSeal() {
		if (!item || !seal || !ctx) return
		void writeSealState(ctx, 'weapon', item, nextSealState(seal.state))
	}

	// Use $derived to ensure consistent computation between server and client
	let imageUrl = $derived.by(() => {
		const isMain = position === -1 || item?.mainhand
		const variant = isMain ? 'main' : 'grid'

		// For element-changeable weapons (element === 0), use instance element.
		// Mainhand images don't have a null-element variant, so default to fire.
		const element =
			item?.weapon?.element === 0 ? (item?.element ?? (isMain ? ElementId.Fire : 0)) : undefined
		const transformation = getWeaponTransformation(
			seriesHasTranscendenceArt(item?.weapon?.series),
			item?.uncapLevel,
			item?.transcendenceStep
		)

		return getWeaponImage(
			item?.weapon?.granblueId,
			variant,
			element,
			transformation,
			item?.weapon?.elementVariantIds
		)
	})

	// Fallback URL for element-changeable weapons whose _0 image doesn't exist
	// Only needed when the instance has no element set (element is 0 or null)
	let fallbackUrl = $derived.by(() => {
		if (item?.weapon?.element !== 0) return undefined
		if (item?.element) return undefined
		const isMain = position === -1 || item?.mainhand
		const variant = isMain ? 'main' : 'grid'
		const transformation = getWeaponTransformation(
			seriesHasTranscendenceArt(item?.weapon?.series),
			item?.uncapLevel,
			item?.transcendenceStep
		)
		return getWeaponFallbackImage(item?.weapon?.granblueId, variant, transformation)
	})

	// Get awakening image URL using utility
	let awakeningImage = $derived(getAwakeningImage(item?.awakening))

	// Get weapon key images using utility
	let weaponKeyImages = $derived(getWeaponKeyImages(item?.weaponKeys, item?.weapon?.proficiency))

	// Get AX skill images using utility
	let axSkillImages = $derived(getAxSkillImages(item?.ax))

	// Get befoulment images using utility
	let befoulmentImages = $derived(getBefoulmentImages(item?.befoulment))

	let isActive = $derived(actions.isActive)

	// Check if this slot is currently selected for adding/replacing an item
	let isSelected = $derived(
		ctx?.getSelectedSlot?.() === position && ctx?.getActiveTab?.() === GridType.Weapon
	)

	// Determine element class for focus ring
	// For weapons with null element that have an instance element, use it
	let elementClass = $derived(
		getElementClassName(
			item?.weapon?.element === 0 && item?.element ? item.element : item?.weapon?.element
		)
	)

	// Edit is always available for owners — non-modifiable weapons still get
	// the notes-only pane so substitutes/description can be configured.
	let canEditItem = $derived(!!item?.id)

	function getSaveCallback() {
		return async (id: string, updates: Partial<GridWeapon>) => {
			const party = ctx.getParty()
			await ctx.services.gridService.updateWeapon(party.id, id, updates)
		}
	}

	function viewDetails() {
		if (!item) return
		const party = ctx.getParty()
		openDetailsSidebar({
			type: 'weapon',
			item,
			onSaveWeapon: getSaveCallback(),
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
		openWeaponEditSidebar(item, getSaveCallback(), {
			partyId: party?.id,
			partyShortcode: party?.shortcode
		})
	}

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

	const skillDimmed = $derived(skillHighlight.active && !skillHighlight.contributes(item?.id))
</script>

<div
	class="unit {elementClass}"
	class:empty={!item}
	class:extra={position >= 9}
	class:is-active={isActive}
	class:orphaned={item?.orphaned}
	class:skill-dimmed={skillDimmed}
>
	{#if item}
		<UnitMenuContainer showGearButton={true} gearPosition="top-right">
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
									{#each axSkillImages as skill, idx (idx)}
										<img class="skill" src={skill.url} alt={skill.alt} />
									{/each}
									{#each befoulmentImages as skill, idx (idx)}
										<img class="skill befoulment" src={skill.url} alt={skill.alt} />
									{/each}
									{#each weaponKeyImages as skill, idx (idx)}
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
								onerror={(e) => handleImageFallback(e, fallbackUrl)}
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
						<BookmarkOverlay element={item?.element || item?.weapon?.element} />
					{/if}
				</div>
			{/snippet}

			{#snippet menu(variant: 'context' | 'dropdown')}
				<MenuItems
					{variant}
					onEdit={canEditItem ? editItem : undefined}
					onViewDetails={viewDetails}
					onViewInDatabase={canViewDatabase ? actions.viewInDatabase : undefined}
					onViewTeams={actions.viewTeams}
					onAddToTeamsView={actions.isTeamsPaneOpen ? actions.addToTeamsView : undefined}
					onReplace={ctx?.canEdit() ? replace : undefined}
					onDuplicate={ctx?.canEdit() ? duplicate.duplicate : undefined}
					duplicateDisabled={!duplicate.canDuplicate || duplicate.busy}
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
					editLabel={m.context_edit({ type: m.type_weapon() })}
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					viewTeamsLabel={m.context_view_teams_weapon()}
					addToTeamsViewLabel={m.context_add_to_teams_view()}
					replaceLabel={m.context_replace({ type: m.type_weapon() })}
					duplicateLabel={m.context_duplicate({ type: m.type_weapon() })}
					removeLabel={m.context_remove()}
					editExtras={canToggleSeal ? sealMenuItems : undefined}
				/>
				{#snippet sealMenuItems()}
					{#if item && seal}
						<SealMenuItems {variant} type="weapon" {item} {seal} />
					{/if}
				{/snippet}
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
				role="button"
				tabindex="0"
				onclick={() =>
					ctx?.canEdit() && ctx?.openPicker && ctx.openPicker({ type: 'weapon', position, item })}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						if (ctx?.canEdit() && ctx?.openPicker)
							ctx.openPicker({ type: 'weapon', position, item })
					}
				}}
			>
				<img
					class="image placeholder"
					alt=""
					src={getPlaceholderImage('weapon', position === -1 ? 'main' : 'grid')}
				/>
				{#if seal}
					<SealOverlay {seal} filled={false} />
				{/if}
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
			minUncapLevel={position >= 9
				? (item.weapon?.uncap?.extraPrerequisite ?? undefined)
				: undefined}
			updateUncap={actions.updateUncap}
			updateTranscendence={actions.updateTranscendence}
		/>
	{/if}
	<div class="name" class:not-in-collection={notInCollection}>
		<span class="name-text">{item ? localizedName(item?.weapon?.name) : ''}</span>
		{#if item}
			<SubstituteCountBadge
				count={item.substitutions?.length ?? 0}
				element={item.element || item.weapon?.element}
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
	type="weapon"
	name={item?.weapon ? localizedName(item.weapon.name) : null}
	onConfirm={actions.removeAction.run}
/>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/rep' as rep;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/unit' as unit;

	@include unit.unit-root;

	.unit {
		transition: opacity 150ms ease;

		&.skill-dimmed {
			opacity: 0.3;
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
				color: var(--extra-purple-text);
			}
		}
	}

	@include unit.unit-slot;

	.focus-ring-wrapper {
		&.editable:hover {
			transform: layout.$scale-wide;
		}

		&.editable.main:hover {
			transform: layout.$scale-tall;
		}
	}

	.frame {
		overflow: hidden;
	}

	.frame.weapon.main {
		@include rep.aspect(rep.$weapon-main-w, rep.$weapon-main-h);
	}

	.frame.weapon.cell {
		@include rep.aspect(rep.$weapon-cell-w, rep.$weapon-cell-h);
	}

	// Weapons render the awakening icon at the top-left of the frame, which
	// collides with the bookmark overlay's default top-anchored position.
	// Pull the bookmark up and slightly out so it sits above the awakening
	// icon. Awakening's own positioning is unchanged.
	.focus-ring-wrapper :global(.bookmark-overlay) {
		margin-top: -21px;
		margin-left: -6px;
	}

	.modifiers {
		position: absolute;
		width: 100%;
		height: 100%;
		z-index: effects.$z-sticky;
		pointer-events: none;

		@include unit.unit-orphaned-badge;

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

				&.befoulment {
					width: 42px;
					height: 42px;
				}
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

				&.befoulment {
					width: 42px;
					height: 42px;
				}
			}
		}
	}

	@include unit.unit-focus-rings;
	@include unit.unit-active-names;
</style>
