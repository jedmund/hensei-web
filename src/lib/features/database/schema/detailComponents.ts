/**
 * The detail view's components for each `ComponentName`: a field's value
 * (`render.detail`) or a section's body (`Section.component`). Each gets the
 * full record.
 */
import type { Component } from 'svelte'
import CharacterRelatedUnits from '$lib/features/database/characters/detail/CharacterRelatedUnits.svelte'
import AwakeningImage from '$lib/features/database/awakenings/detail/AwakeningImage.svelte'
import CharacterUncap from '$lib/features/database/characters/detail/CharacterUncap.svelte'
import WeaponSeriesVariants from '$lib/features/database/weapon-series/detail/WeaponSeriesVariants.svelte'
import EventRaids from '$lib/features/database/events/detail/EventRaids.svelte'
import RaidGroupRaids from '$lib/features/database/raid-groups/detail/RaidGroupRaids.svelte'
import BulletSlots from '$lib/features/database/weapons/detail/BulletSlots.svelte'
import ElementVariantIds from '$lib/features/database/weapons/detail/ElementVariantIds.svelte'
import WeaponAwakenings from '$lib/features/database/weapons/detail/WeaponAwakenings.svelte'
import WeaponForge from '$lib/features/database/weapons/detail/WeaponForge.svelte'
import WeaponUncapIndicator from '$lib/features/database/weapons/detail/WeaponUncapIndicator.svelte'
import StickerImages from '$lib/features/database/stickers/detail/StickerImages.svelte'
import type { ComponentName } from './types'

// The registry boundary is untyped: each component reads its own record type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DETAIL_COMPONENTS: Record<ComponentName, Component<{ record: any }>> = {
	uncapIndicator: WeaponUncapIndicator,
	weaponAwakenings: WeaponAwakenings,
	weaponForge: WeaponForge,
	elementVariantIds: ElementVariantIds,
	bulletSlots: BulletSlots,
	characterUncap: CharacterUncap,
	characterRelated: CharacterRelatedUnits,
	weaponSeriesVariants: WeaponSeriesVariants,
	awakeningImage: AwakeningImage,
	raidGroupRaids: RaidGroupRaids,
	eventRaids: EventRaids,
	stickerImages: StickerImages
}
