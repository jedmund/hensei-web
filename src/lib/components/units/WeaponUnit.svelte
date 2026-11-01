<script lang="ts">
	import type { GridWeapon } from '$lib/types/api/party'
	import { usePartyContext } from '$lib/types/party-context'
	import UnitFrame from './UnitFrame.svelte'
	import OrphanedBadge from './OrphanedBadge.svelte'
	import Tooltip from '$lib/components/ui/Tooltip.svelte'
	import { getPlaceholderImage, handleImageFallback } from '$lib/utils/images/core'
	import {
		getWeaponTransformation,
		getWeaponFallbackImage,
		getWeaponImage
	} from '$lib/utils/images/weapons'
	import { seriesHasTranscendenceArt } from '$lib/utils/weaponSeries'
	import { openWeaponEditSidebar } from '$lib/features/details/openDetailsSidebar.svelte'
	import { getElementClassName, ElementId } from '$lib/utils/element'
	import { skillHighlight } from '$lib/stores/skillHighlight.svelte'
	import {
		getAwakeningImage,
		getWeaponKeyImages,
		getAxSkillImages,
		getBefoulmentImages
	} from '$lib/utils/modifiers'
	import { localizedName } from '$lib/utils/locale'
	import { useUnitActions } from './useUnitActions.svelte'
	import { useUnitDuplicate } from './useUnitDuplicate.svelte'
	import { useUnitSeal } from './useUnitSeal.svelte'
	interface Props {
		item?: GridWeapon | undefined
		position: number
		notInCollection?: boolean
		inCollection?: boolean
	}

	let { item, position, notInCollection = false, inCollection = false }: Props = $props()

	const ctx = usePartyContext()

	async function saveWeapon(id: string, updates: Partial<GridWeapon>) {
		const party = ctx.getParty()
		await ctx.services.gridService.updateWeapon(party.id, id, updates)
	}

	const actions = useUnitActions({
		type: 'weapon',
		ctx,
		item: () => item,
		position: () => position,
		entity: () => item?.weapon,
		details: { onSaveWeapon: saveWeapon }
	})
	const duplicate = useUnitDuplicate({
		type: 'weapon',
		ctx,
		item: () => item,
		allowed: () => !item?.weapon?.limit,
		linkedToCollection: () => !!item?.collectionWeaponId
	})

	// Evoking Solomonis: seal state, including the Extra slots
	const seal = useUnitSeal({
		type: 'weapon',
		ctx,
		item: () => item,
		position: () => position
	})

	let isMain = $derived(!!(item?.mainhand || position === -1))

	// Use $derived to ensure consistent computation between server and client
	let imageUrl = $derived.by(() => {
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

	function editItem() {
		if (!item) return
		openWeaponEditSidebar(item, saveWeapon, actions.partyRefs())
	}

	const skillDimmed = $derived(skillHighlight.active && !skillHighlight.contributes(item?.id))
</script>

<UnitFrame
	type="weapon"
	{item}
	entity={item?.weapon}
	{position}
	{actions}
	{duplicate}
	{seal}
	{elementClass}
	accentElement={item?.element || item?.weapon?.element}
	{imageUrl}
	onImageError={(e) => handleImageFallback(e, fallbackUrl)}
	placeholderImage={getPlaceholderImage('weapon', position === -1 ? 'main' : 'grid')}
	selected={actions.isSelected}
	{notInCollection}
	{inCollection}
	onEdit={canEditItem ? editItem : undefined}
	uncap={{
		minUncapLevel: position >= 9 ? (item?.weapon?.uncap?.extraPrerequisite ?? undefined) : undefined
	}}
	rootClass={{ extra: position >= 9, 'skill-dimmed': skillDimmed }}
	wrapperClass={{ main: isMain }}
	frameClass={['weapon', { main: isMain, cell: !isMain, extra: position >= 9 }]}
>
	{#snippet badges()}
		<div class="modifiers">
			{#if item?.orphaned}
				<OrphanedBadge />
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
	{/snippet}
</UnitFrame>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/effects' as effects;

	// The modifier layer over the image. Its size variants follow the frame,
	// which belongs to UnitFrame, so the frame classes are matched globally.
	.modifiers {
		position: absolute;
		width: 100%;
		height: 100%;
		z-index: effects.$z-sticky;
		pointer-events: none;

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

	// Position modifiers for grid weapons
	:global(.frame.weapon.cell) .modifiers {
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
	:global(.frame.weapon.main) .modifiers {
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
</style>
