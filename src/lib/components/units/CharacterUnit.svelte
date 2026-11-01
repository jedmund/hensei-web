<script lang="ts">
	import type { GridCharacter } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import Icon from '$lib/components/Icon.svelte'
	import UnitFrame from './UnitFrame.svelte'
	import OrphanedBadge from './OrphanedBadge.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import RichTooltip from '$lib/components/ui/RichTooltip.svelte'
	import { getAbilitySlots } from '$lib/utils/fullAutoSkills'
	import { getPlaceholderImage } from '$lib/utils/images/core'
	import { getCharacterImageWithPose } from '$lib/utils/images/characters'
	import { getSimplePortraits } from '$lib/stores/simplePortraits.svelte'
	import { openCharacterEditSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { canCharacterBeModified } from '$lib/utils/modificationDetector'
	import { getElementClassName } from '$lib/utils/element'
	import perpetuityFilled from '$src/assets/icons/perpetuity/filled.svg'
	import perpetuityEmpty from '$src/assets/icons/perpetuity/empty.svg'
	import * as m from '$lib/paraglide/messages'
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
	async function saveCharacter(id: string, updates: Partial<GridCharacter>) {
		const party = ctx.getParty()
		await ctx.services.gridService.updateCharacter(party.id, id, updates)
	}

	const actions = useUnitActions({
		type: 'character',
		ctx,
		item: () => item,
		position: () => position,
		entity: () => item?.character,
		details: { onSaveCharacter: saveCharacter }
	})

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

	// Determine element class for focus ring
	let elementClass = $derived(
		getElementClassName(item?.character?.element || mainWeaponElement || partyElement)
	)

	let canEditItem = $derived(canCharacterBeModified(item))

	function editItem() {
		if (!item) return
		openCharacterEditSidebar(item, saveCharacter, actions.partyRefs())
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

<UnitFrame
	type="character"
	{item}
	entity={item?.character}
	{position}
	{actions}
	{elementClass}
	accentElement={item?.character?.element ?? mainWeaponElement ?? partyElement}
	{imageUrl}
	placeholderImage={getPlaceholderImage('character', 'grid')}
	selected={!item && actions.isSelected}
	{notInCollection}
	{inCollection}
	onEdit={canEditItem ? editItem : undefined}
	uncap={{
		special: item?.character?.special,
		maxTranscendenceStage: item?.character?.uncap?.maxTranscendenceStage
	}}
	rekeyUncap
	frameClass="character cell"
>
	{#snippet badges()}
		{#if item && ctx?.canEdit()}
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
		{:else if item?.perpetuity}
			<img
				class="perpetuity static"
				src={perpetuityFilled}
				alt={m.label_perpetuity_ring()}
				title={m.label_perpetuity_ring()}
			/>
		{/if}
		{#if item?.orphaned}
			<OrphanedBadge />
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
	{/snippet}

	{#snippet nameExtras()}
		{#if item?.artifact}
			<Icon name="gem" size={12} class="artifact-indicator" />
		{/if}
	{/snippet}

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
</UnitFrame>

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

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/unit' as unit;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/effects' as effects;

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
</style>
