<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import { page } from '$app/stores'
	import Icon from '$lib/components/Icon.svelte'
	import UnitMenuContainer from '$lib/components/ui/menu/UnitMenuContainer.svelte'
	import MenuItems from '$lib/components/ui/menu/MenuItems.svelte'
	import RemoveUnitDialog from './RemoveUnitDialog.svelte'
	import SubstituteCountBadge from './SubstituteCountBadge.svelte'
	import BookmarkOverlay from './BookmarkOverlay.svelte'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import { getAbilitySlots } from '$lib/utils/fullAutoSkills'
	import { getPlaceholderImage } from '$lib/utils/images/core'
	import { getCharacterImageWithPose } from '$lib/utils/images/characters'
	import { getSimplePortraits } from '$lib/stores/simplePortraits.svelte'
	import {
		openDetailsSidebar,
		openCharacterEditSidebar
	} from '$lib/features/details/openDetailsSidebar.svelte'
	import { canCharacterBeModified } from '$lib/utils/modificationDetector'
	import { canAccessDatabase } from '$lib/utils/database'
	import { getElementClassName } from '$lib/utils/element'
	import { GridType } from '$lib/types/enums'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'
	import perpetuityEmpty from '$src/assets/icons/perpetuity/empty.svg'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'
	import { toast } from 'svelte-sonner'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { useUnitActions } from './useUnitActions.svelte'
	interface Props {
		item?: GridCharacter | undefined
		position: number
		mainWeaponElement?: number | null | undefined
		partyElement?: number | null | undefined
		gender?: number
		notInCollection?: boolean
		inCollection?: boolean
	}

	let {
		item,
		position,
		mainWeaponElement,
		partyElement,
		gender = 0,
		notInCollection = false,
		inCollection = false
	}: Props = $props()

	const ctx = usePartyContext()
	const simplePortraits = getSimplePortraits()
	const actions = useUnitActions({
		type: 'character',
		ctx,
		item: () => item,
		position: () => position,
		entity: () => item?.character
	})
	const { remove, replace } = actions

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
			item.character.styleSwap,
			simplePortraits.value,
			item.character.element,
			item.character.genderVariants ? gender : undefined,
			item.character.special
		)
	})

	let isActive = $derived(actions.isActive)

	// Check if this empty slot is currently selected for adding an item
	let isEmptySelected = $derived(
		!item && ctx?.getSelectedSlot?.() === position && ctx?.getActiveTab?.() === GridType.Character
	)

	// Determine element class for focus ring
	let elementClass = $derived(
		getElementClassName(item?.character?.element || mainWeaponElement || partyElement)
	)

	let canEditItem = $derived(canCharacterBeModified(item))

	function getSaveCallback() {
		return async (id: string, updates: Partial<GridCharacter>) => {
			const party = ctx.getParty()
			await ctx.services.gridService.updateCharacter(party.id, id, updates)
		}
	}

	function viewDetails() {
		if (!item) return
		const party = ctx.getParty()
		openDetailsSidebar({
			type: 'character',
			item,
			onSaveCharacter: getSaveCallback(),
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
		openCharacterEditSidebar(item, getSaveCallback(), {
			partyId: party?.id,
			partyShortcode: party?.shortcode
		})
	}

	// Check if user can view database (role >= 7)
	let canViewDatabase = $derived(canAccessDatabase($page.data.account?.role))

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
			await ctx.services.gridService.switchCharacterStyle(item.id, editKey || undefined)
		} catch (err) {
			console.error('Error switching style:', err)
			toast.error(extractErrorMessage(err, 'Failed to switch style'))
		}
	}

	// Full Auto skill display: only meaningful when the party is in Full Auto.
	// Shows every ability as an icon; an eligible ability that is toggled off is
	// dimmed, while ineligible abilities (heal/field/target-ally) never dim and
	// always read as Disabled since they can't be used in Full Auto.
	let partyFullAuto = $derived(ctx?.getParty?.()?.fullAuto ?? false)
	let abilitySlots = $derived(item?.character ? getAbilitySlots(item.character) : [])
	let faSkills = $derived(item?.fullAutoSkills ?? {})

	// Absent or true => ON; only an explicit false is OFF.
	function isFaSlotOn(slot: number): boolean {
		return faSkills[String(slot)] !== false
	}

	async function toggleFaSkill(e: Event, slot: number) {
		e.stopPropagation()
		if (!item?.id || !ctx?.canEdit()) return

		try {
			const party = ctx.getParty()
			const editKey = ctx.getEditKey()
			// Send the full object so persisted state stays explicit.
			await ctx.services.gridService.updateCharacter(
				party.id,
				item.id,
				{ fullAutoSkills: { ...faSkills, [String(slot)]: !isFaSlotOn(slot) } },
				editKey || undefined
			)
		} catch (err) {
			console.error('Error toggling Full Auto skill:', err)
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
							class="frame character cell {elementClass}"
							class:editable={ctx?.canEdit()}
							class:is-active={isActive}
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
							{#if ctx?.canEdit()}
								<button
									class="perpetuity"
									class:active={item.perpetuity}
									onclick={togglePerpetuity}
									title={item.perpetuity
										? m.tooltip_remove_perpetuity_ring()
										: m.tooltip_add_perpetuity_ring()}
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
										<button class="style-switch" onclick={switchStyle}>
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
					{#if inCollection}
						<BookmarkOverlay
							element={item?.character?.element ?? mainWeaponElement ?? partyElement}
						/>
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
					onRemove={ctx?.canEdit() ? remove : undefined}
					canEdit={ctx?.canEdit()}
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
				role="button"
				tabindex="0"
				onclick={() =>
					ctx?.canEdit() &&
					ctx?.openPicker &&
					ctx.openPicker({ type: 'character', position, item })}
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						if (ctx?.canEdit() && ctx?.openPicker)
							ctx.openPicker({ type: 'character', position, item })
					}
				}}
			>
				<img class="image placeholder" alt="" src={getPlaceholderImage('character', 'grid')} />
				{#if ctx?.canEdit()}
					<span class="icon">
						<Icon name="plus" size={24} />
					</span>
				{/if}
			</div>
		{/key}
	{/if}
	{#key item?.id}
		{#if item}
			<UncapIndicator
				type="character"
				uncapLevel={item.uncapLevel}
				transcendenceStage={item.transcendenceStep}
				special={item.character?.special}
				flb={item.character?.uncap?.flb}
				ulb={item.character?.uncap?.ulb}
				transcendence={item.character?.uncap?.transcendence}
				maxTranscendenceStage={item.character?.uncap?.maxTranscendenceStage}
				editable={ctx?.canEdit()}
				updateUncap={actions.updateUncap}
				updateTranscendence={actions.updateTranscendence}
			/>
		{/if}
	{/key}
	<div class="name" class:not-in-collection={notInCollection}>
		<span class="name-text">{item ? localizedName(item?.character?.name) : ''}</span>
		{#if item?.artifact}
			<Icon name="gem" size={12} class="artifact-indicator" />
		{/if}
		{#if item}
			<SubstituteCountBadge
				count={item.substitutions?.length ?? 0}
				element={item.character?.element ?? mainWeaponElement ?? partyElement}
			/>
		{/if}
	</div>
	{#if item?.character}
		<CharacterTags character={item.character} />
	{/if}
	{#if item?.character && partyFullAuto && abilitySlots.length > 0}
		<div class="fa-skills" data-own-hover>
			{#each abilitySlots as s (s.slot)}
				{@const on = s.eligible && isFaSlotOn(s.slot)}
				{@const dimmed = s.eligible && !isFaSlotOn(s.slot)}
				<RichTooltip>
					{#snippet content()}
						<div class="fa-skill-tip">
							<span class="fa-skill-tip-name">{s.name}</span>
							<span class="fa-skill-tip-status" class:enabled={on}>
								<Icon name="full-auto" size={16} />
								{on ? m.full_auto_skill_enabled() : m.full_auto_skill_disabled()}
							</span>
						</div>
					{/snippet}
					{#if ctx?.canEdit() && s.eligible}
						<button
							class="fa-skill"
							class:dimmed
							onclick={(e) => toggleFaSkill(e, s.slot)}
							aria-label={s.name}
							aria-pressed={on}
						>
							{@render FaSkillIcon(s.iconUrl, s.name)}
						</button>
					{:else}
						<span class="fa-skill" class:dimmed>
							{@render FaSkillIcon(s.iconUrl, s.name)}
						</span>
					{/if}
				</RichTooltip>
			{/each}
		</div>
	{/if}
</div>

{#snippet FaSkillIcon(iconUrl: string | null, name: string)}
	{#if iconUrl}
		<img
			class="fa-skill-icon"
			src={iconUrl}
			alt={name}
			loading="lazy"
			onerror={(e) => ((e.currentTarget as HTMLImageElement).style.visibility = 'hidden')}
		/>
	{:else}
		<span class="fa-skill-icon placeholder"></span>
	{/if}
{/snippet}

<RemoveUnitDialog
	bind:open={actions.removeConfirmOpen}
	type="character"
	name={item?.character ? localizedName(item.character.name) : null}
	onConfirm={actions.removeAction.run}
/>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/rep' as rep;
	@use '$src/themes/unit' as unit;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

	@include unit.unit-root;
	@include unit.unit-slot;

	.focus-ring-wrapper.editable:hover {
		transform: scale(1.05);
	}

	.frame.character.cell {
		@include rep.aspect(rep.$char-cell-w, rep.$char-cell-h);
	}

	.image {
		border-radius: layout.$input-corner;
	}

	.name :global(.artifact-indicator) {
		color: var(--extra-purple-text);
		flex-shrink: 0;
	}

	.fa-skills {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
	}

	.fa-skill {
		display: inline-flex;
		padding: 0;
		border: none;
		background: transparent;
		line-height: 0;
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;

		&.dimmed {
			opacity: 0.35;
		}
	}

	button.fa-skill {
		cursor: pointer;

		&:hover {
			transform: scale(1.15);
		}
	}

	.fa-skill-icon {
		width: 32px;
		height: 32px;
		object-fit: cover;
		border-radius: layout.$item-corner-small;
		border: 1px solid var(--border-primary);
		background: var(--placeholder-bg);

		&.placeholder {
			display: inline-block;
		}
	}

	:global(.fa-skill-tip) {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-quarter;
	}

	:global(.fa-skill-tip-status) {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: spacing.$unit-half;
		color: var(--text-secondary);
	}

	// Enabled abilities use the bright Full Auto yellow for the icon (currentColor)
	// and label. --full-auto-bg is the brand yellow and stays bright on the dark
	// tooltip background regardless of the app theme.
	:global(.fa-skill-tip-status.enabled) {
		color: var(--full-auto-bg);
	}

	.perpetuity {
		top: calc(spacing.$unit * -1);
		right: 44px;
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
	}

	@include unit.unit-toggle-badge(perpetuity);

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
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;

		&:hover {
			transform: scale(1.15);
			box-shadow: var(--shadow-md);
		}
	}

	@include unit.unit-shared-styles;

	@include unit.unit-orphaned-badge;
</style>
