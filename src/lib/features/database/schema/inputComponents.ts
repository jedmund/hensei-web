/**
 * The forms' inputs for each `InputName`: values no built-in input edits,
 * named by a field's `render.input`.
 */
import type { Component } from 'svelte'
import ArtifactSkillBaseValuesInput from '$lib/features/database/artifact-skills/inputs/ArtifactSkillBaseValuesInput.svelte'
import AwakeningImageInput from '$lib/features/database/awakenings/inputs/AwakeningImageInput.svelte'
import RoleIconInput from '$lib/features/database/character-roles/inputs/RoleIconInput.svelte'
import CharacterUncapInput from '$lib/features/database/characters/inputs/CharacterUncapInput.svelte'
import WeaponSeriesVariantsInput from '$lib/features/database/weapon-series/inputs/WeaponSeriesVariantsInput.svelte'
import EventRaidsInput from '$lib/features/database/events/inputs/EventRaidsInput.svelte'
import ElementVariantIdsInput from '$lib/features/database/weapons/inputs/ElementVariantIdsInput.svelte'
import WeaponAwakeningsInput from '$lib/features/database/weapons/inputs/WeaponAwakeningsInput.svelte'
import WeaponUncapInput from '$lib/features/database/weapons/inputs/WeaponUncapInput.svelte'
import StickerImagesInput from '$lib/features/database/stickers/inputs/StickerImagesInput.svelte'
import StickerLibraryInput from '$lib/features/database/stickers/inputs/StickerLibraryInput.svelte'
import StickerSlugInput from '$lib/features/database/stickers/inputs/StickerSlugInput.svelte'
import type { InputProps } from './inputs/types'
import type { InputName } from './types'

export const INPUT_COMPONENTS: Record<InputName, Component<InputProps>> = {
	uncapIndicator: WeaponUncapInput,
	weaponAwakenings: WeaponAwakeningsInput,
	elementVariantIds: ElementVariantIdsInput,
	characterUncap: CharacterUncapInput,
	weaponSeriesVariants: WeaponSeriesVariantsInput,
	awakeningImage: AwakeningImageInput,
	eventRaids: EventRaidsInput,
	stickerImages: StickerImagesInput,
	stickerLibrary: StickerLibraryInput,
	stickerSlug: StickerSlugInput,
	roleIcon: RoleIconInput,
	artifactSkillBaseValues: ArtifactSkillBaseValuesInput
}
