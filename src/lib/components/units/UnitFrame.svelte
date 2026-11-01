<script lang="ts">
	/**
	 * The frame every grid unit (character, weapon, summon) shares: the focus
	 * ring, the image button that opens the details sidebar, the empty "+"
	 * slot that opens the picker, the seal overlay, the context and gear
	 * menus, the uncap indicator, the name row with its substitutes badge, and
	 * the remove and duplicate dialogs.
	 *
	 * The unit passes its per-type values (classes, image, element) and draws
	 * its own parts through snippets. Size and type styles key on the type
	 * class the unit puts on the frame (`.frame.weapon.main` and so on).
	 */
	import type { Snippet } from 'svelte'
	import type { ClassValue } from 'svelte/elements'
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import type { LocalizedName } from '$lib/types/api/entities'
	import { usePartyContext } from '$lib/types/party-context'
	import { page } from '$app/stores'
	import Icon from '$lib/components/Icon.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import DuplicateCollectionDialog from '$lib/components/dialogs/DuplicateCollectionDialog.svelte'
	import SealOverlay from '$lib/components/solomonis/grid/SealOverlay.svelte'
	import SealMenuItems from '$lib/components/solomonis/grid/SealMenuItems.svelte'
	import RemoveUnitDialog from './RemoveUnitDialog.svelte'
	import SubstituteCountBadge from './SubstituteCountBadge.svelte'
	import BookmarkOverlay from './BookmarkOverlay.svelte'
	import { canAccessDatabase } from '$lib/utils/database'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import type { UnitActions, UnitType } from './useUnitActions.svelte'
	import type { UnitDuplicate } from './useUnitDuplicate.svelte'
	import type { UnitSeal } from './useUnitSeal.svelte'

	interface Props {
		type: UnitType
		item: GridCharacter | GridWeapon | GridSummon | undefined
		/** The catalogue entry behind the item (item.character / .weapon / .summon) */
		entity:
			| {
					granblueId?: string | null
					name?: LocalizedName | string | null
					uncap?: { flb?: boolean; ulb?: boolean; transcendence?: boolean } | null
			  }
			| undefined
		position: number
		actions: UnitActions
		duplicate?: UnitDuplicate | undefined
		seal?: UnitSeal | undefined
		/** Element class for the focus ring, frame and name colours */
		elementClass: string
		/** Element id for the collection bookmark and substitutes badge */
		accentElement?: number | null | undefined
		imageUrl: string
		onImageError?: ((e: Event) => void) | undefined
		placeholderImage: string
		/** Whether the slot is selected for adding or replacing an item */
		selected?: boolean
		notInCollection?: boolean
		inCollection?: boolean
		/** Shows the empty slot greyed out and closed to edits */
		disabled?: boolean | undefined
		/** Explains a disabled slot on hover */
		disabledTooltip?: string | undefined
		/** Edit menu entry; undefined hides it */
		onEdit?: (() => void) | undefined
		uncap?: {
			special?: boolean | undefined
			maxTranscendenceStage?: number | undefined
			minUncapLevel?: number | undefined
		}
		/** Remount the uncap indicator when the item changes */
		rekeyUncap?: boolean
		rootClass?: ClassValue
		wrapperClass?: ClassValue
		/** Type and size classes on the frame (`character cell`, `weapon main`, ...) */
		frameClass: ClassValue
		/** Drawn inside the filled frame, before the image */
		badges?: Snippet
		/** Drawn inside the focus ring, after the frame */
		wrapperExtras?: Snippet
		/** Drawn in the name row, between the name and the substitutes badge */
		nameExtras?: Snippet
		/** Drawn below the name row */
		children?: Snippet
	}

	let {
		type,
		item,
		entity,
		position,
		actions,
		duplicate,
		seal,
		elementClass,
		accentElement,
		imageUrl,
		onImageError,
		placeholderImage,
		selected = false,
		notInCollection = false,
		inCollection = false,
		disabled,
		disabledTooltip,
		onEdit,
		uncap,
		rekeyUncap = false,
		rootClass,
		wrapperClass,
		frameClass,
		badges,
		wrapperExtras,
		nameExtras,
		children
	}: Props = $props()

	const ctx = usePartyContext()

	const TYPE_LABEL = {
		character: m.type_character,
		weapon: m.type_weapon,
		summon: m.type_summon
	}

	const VIEW_TEAMS_LABEL = {
		character: m.context_view_teams_character,
		weapon: m.context_view_teams_weapon,
		summon: m.context_view_teams_summon
	}

	let canEdit = $derived(ctx?.canEdit())

	// A disabled slot can't be picked or edited
	let canEditSlot = $derived(!disabled && !!ctx?.canEdit())

	let isActive = $derived(actions.isActive)

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

	function openPicker() {
		if (canEditSlot && ctx?.openPicker) ctx.openPicker({ type, position, item })
	}

	function onActivateKey(e: KeyboardEvent, activate: () => void) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			activate()
		}
	}
</script>

<div
	class={['unit', elementClass, rootClass]}
	class:empty={!item}
	class:is-active={isActive}
	class:orphaned={item?.orphaned}
>
	{#if item}
		<UnitMenuContainer showGearButton={true} gearPosition="top-right">
			{#snippet trigger()}
				<div
					class={['focus-ring-wrapper', elementClass, wrapperClass]}
					class:is-active={isActive}
					class:editable={canEdit}
				>
					{#key item?.id ?? position}
						<div
							class={['frame', frameClass, elementClass]}
							class:editable={canEdit}
							class:is-active={isActive}
							class:is-selected={selected}
							class:not-in-collection={notInCollection}
							role="button"
							tabindex="0"
							onclick={() => actions.viewDetails()}
							onkeydown={(e) => onActivateKey(e, actions.viewDetails)}
						>
							{@render badges?.()}
							<img
								class={['image', elementClass]}
								class:placeholder={!entity?.granblueId}
								class:not-in-collection={notInCollection}
								alt={localizedName(entity?.name)}
								src={imageUrl}
								onerror={onImageError}
							/>
							{#if seal?.seal}
								<SealOverlay
									seal={seal.seal}
									filled={true}
									onToggle={seal.canToggle ? seal.toggle : undefined}
								/>
							{/if}
						</div>
					{/key}
					{#if inCollection}
						<BookmarkOverlay element={accentElement} />
					{/if}
					{@render wrapperExtras?.()}
				</div>
			{/snippet}

			{#snippet menu(variant: 'context' | 'dropdown')}
				<MenuItems
					{variant}
					{onEdit}
					onViewDetails={actions.viewDetails}
					onViewInDatabase={canViewDatabase ? actions.viewInDatabase : undefined}
					onViewTeams={actions.viewTeams}
					onAddToTeamsView={actions.isTeamsPaneOpen ? actions.addToTeamsView : undefined}
					onReplace={canEdit ? actions.replace : undefined}
					onDuplicate={canEdit && duplicate ? duplicate.duplicate : undefined}
					duplicateDisabled={duplicate ? !duplicate.canDuplicate || duplicate.busy : undefined}
					onRemove={canEdit ? actions.remove : undefined}
					{canEdit}
					editLabel={m.context_edit({ type: TYPE_LABEL[type]() })}
					viewDetailsLabel={m.context_view_details()}
					viewInDatabaseLabel={m.context_view_in_database()}
					viewTeamsLabel={VIEW_TEAMS_LABEL[type]()}
					addToTeamsViewLabel={m.context_add_to_teams_view()}
					replaceLabel={m.context_replace({ type: TYPE_LABEL[type]() })}
					duplicateLabel={duplicate ? m.context_duplicate({ type: TYPE_LABEL[type]() }) : undefined}
					removeLabel={m.context_remove()}
					editExtras={seal?.canToggle ? sealMenuItems : undefined}
				/>
				{#snippet sealMenuItems()}
					{#if seal?.item && seal.seal}
						<SealMenuItems {variant} type={seal.type} item={seal.item} seal={seal.seal} />
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
	{/if}
	{#key rekeyUncap ? item?.id : undefined}
		{#if item}
			<UncapIndicator
				{type}
				uncapLevel={item.uncapLevel}
				transcendenceStage={item.transcendenceStep}
				special={uncap?.special}
				flb={entity?.uncap?.flb}
				ulb={entity?.uncap?.ulb}
				transcendence={entity?.uncap?.transcendence}
				maxTranscendenceStage={uncap?.maxTranscendenceStage}
				editable={canEdit}
				minUncapLevel={uncap?.minUncapLevel}
				updateUncap={actions.updateUncap}
				updateTranscendence={actions.updateTranscendence}
			/>
		{/if}
	{/key}
	<div class="name" class:not-in-collection={notInCollection}>
		<span class="name-text">{item ? localizedName(entity?.name) : ''}</span>
		{@render nameExtras?.()}
		{#if item}
			<SubstituteCountBadge count={item.substitutions?.length ?? 0} element={accentElement} />
		{/if}
	</div>
	{@render children?.()}
</div>

{#snippet emptyFrame()}
	<div
		class={['frame', frameClass]}
		class:editable={canEditSlot}
		class:disabled
		class:is-selected={selected}
		role="button"
		tabindex={disabled ? -1 : 0}
		aria-disabled={disabled}
		onclick={openPicker}
		onkeydown={(e) => onActivateKey(e, openPicker)}
	>
		<img class="image placeholder" alt="" src={placeholderImage} />
		{#if seal?.seal}
			<SealOverlay seal={seal.seal} filled={false} />
		{/if}
		{#if canEditSlot}
			<span class="icon">
				<Icon name="plus" size={24} />
			</span>
		{/if}
	</div>
{/snippet}

{#if duplicate}
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
{/if}

<RemoveUnitDialog
	bind:open={actions.removeConfirmOpen}
	{type}
	name={entity ? localizedName(entity.name) : null}
	onConfirm={actions.removeAction.run}
/>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;
	@use '$src/themes/rep' as rep;

	// Root column: frame, uncap indicator, name
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

	// Weapons fade out when a highlighted skill doesn't come from them
	.unit:has(.frame.weapon) {
		transition: opacity 150ms ease;
	}

	.unit.skill-dimmed {
		opacity: 0.3;
	}

	// Extra weapon slots (position 9 and up)
	.unit.extra {
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
			box-shadow:
				0 0 0 1px rgba(0, 0, 0, 0.12),
				0 0 4px 2px rgba(0, 0, 0, 0.06);
		}
		50% {
			box-shadow:
				0 0 0 1px rgba(0, 0, 0, 0.24),
				0 0 8px 4px rgba(0, 0, 0, 0.12);
		}
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
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.name-text {
		// min-width: 0 lets the text item shrink under content size so long
		// names wrap inside the span instead of forcing the bookmark/badge
		// onto their own flex line.
		min-width: 0;
		text-align: center;
		overflow-wrap: anywhere;
	}

	// Only the main weapon (the wrapper's `main` class) scales less
	.focus-ring-wrapper {
		&.editable:hover {
			transform: layout.$scale-wide;
		}

		&.editable.main:hover {
			transform: layout.$scale-tall;
		}
	}

	.frame.weapon,
	.frame.summon {
		overflow: hidden;
	}

	.frame.disabled {
		opacity: 0.4;
		cursor: default;
	}

	.frame.character.cell {
		@include rep.aspect(rep.$char-cell-w, rep.$char-cell-h);
	}

	.frame.weapon.main {
		@include rep.aspect(rep.$weapon-main-w, rep.$weapon-main-h);
	}

	.frame.weapon.cell {
		@include rep.aspect(rep.$weapon-cell-w, rep.$weapon-cell-h);
	}

	.frame.summon.main,
	.frame.summon.friend {
		@include rep.aspect(rep.$summon-main-w, rep.$summon-main-h);
	}

	.frame.summon.cell {
		@include rep.aspect(rep.$summon-cell-w, rep.$summon-cell-h);
	}

	.frame.character .image {
		border-radius: layout.$input-corner;
	}

	.name :global(.artifact-indicator) {
		color: var(--extra-purple-text);
		flex-shrink: 0;
	}

	// Weapons render the awakening icon at the top-left of the frame, which
	// collides with the bookmark overlay's default top-anchored position.
	// Pull the bookmark up and slightly out so it sits above the awakening
	// icon. Awakening's own positioning is unchanged.
	.frame.weapon ~ :global(.bookmark-overlay) {
		margin-top: -21px;
		margin-left: -6px;
	}

	@keyframes pulse-focus-ring {
		0%,
		100% {
			box-shadow: 0 0 4px 3px currentColor;
		}
		50% {
			box-shadow: 0 0 4px 6px currentColor;
		}
	}

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

	// Orphaned state: characters and summons dim the frame, weapons the image
	.unit.orphaned {
		.frame.character,
		.frame.summon {
			opacity: 0.7;
			border: 2px solid colors.$error;
		}

		.frame.weapon {
			border: 2px solid colors.$error;
		}

		.frame.weapon .image {
			opacity: 0.7;
		}

		.name {
			color: colors.$error;
		}
	}

	// The tooltip's trigger wraps the disabled slot; keep it the slot's width
	:global(.disabled-trigger) {
		display: block;
		width: 100%;
	}
</style>
