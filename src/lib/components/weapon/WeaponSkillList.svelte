<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { localizedName, appLocale } from '$lib/utils/locale'
	import { getWeaponSkillIcon } from '$lib/utils/images/icons'
	import SkillCard from '$lib/components/skills/SkillCard.svelte'
	import SkillGroup from '$lib/components/skills/SkillGroup.svelte'
	import { resolvedClassification } from '$lib/utils/weaponSkillClassification'
	import type { WeaponKey, WeaponSkill, WeaponSkillVersion } from '$lib/types/api/entities'
	import type { WeaponSeriesRef } from '$lib/types/api/weaponSeries'
	import { getWeaponKeyImage } from '$lib/utils/images/weapons'
	import { keySlotForSkill, openKeySlots, weaponKeyTypeName } from '$lib/utils/weaponKeySlots'

	interface Props {
		skills: WeaponSkill[] | undefined
		/** A team's copy: the skills its keys fill show the key (or why there's none) */
		series?: WeaponSeriesRef | undefined
		weaponKeys?: WeaponKey[] | undefined
		uncapLevel?: number | undefined
	}

	let { skills, series, weaponKeys, uncapLevel }: Props = $props()

	const openSlots = $derived(openKeySlots(series, uncapLevel ?? 0))

	// The open key slot that fills this skill, with its key; none without a copy
	function keyFor(position: number) {
		if (!series || uncapLevel === undefined) return undefined
		const slot = keySlotForSkill(series.slug, position)
		// A slot the uncap hasn't opened shows nothing here (the editors say why)
		if (slot === undefined || !openSlots.includes(slot)) return undefined
		return {
			slot,
			key: weaponKeys?.find((k) => k.slot === slot),
			keyType: weaponKeyTypeName(series.slug, slot)
		}
	}

	const locale = $derived(appLocale())
	const slots = $derived([...(skills ?? [])].sort((a, b) => a.position - b.position))

	function versions(slot: WeaponSkill): WeaponSkillVersion[] {
		return [...(slot.versions ?? [])].sort((a, b) => a.ordinal - b.ordinal)
	}

	// Tier label derived from uncap stars + transcendence stage.
	function tierLabel(version: WeaponSkillVersion): string {
		if ((version.transcendenceStage ?? 0) > 0) {
			return m.weapon_skills_tier_transcendence({ n: version.transcendenceStage as number })
		}
		if (version.minUncap === 5) return m.weapon_skills_tier_ulb()
		if (version.minUncap === 4) return m.weapon_skills_tier_flb()
		return m.weapon_skills_tier_base()
	}

	// When a version unlocks: "FLB · Lv 120". A slot's first version shows it as badges, its
	// upgrades as the linked card's label.
	function unlockParts(version: WeaponSkillVersion): string[] {
		const parts = [tierLabel(version)]
		if (version.unlockLevel) parts.push(m.weapon_skills_level({ n: version.unlockLevel }))
		return parts
	}

	// Who the skill applies to, shown as badges.
	function flags(version: WeaponSkillVersion): string[] {
		const flags: string[] = []
		if (version.mainHandOnly) flags.push(m.weapon_skills_main_hand())
		if (version.mcOnly) flags.push(m.weapon_skills_mc_only())
		return flags
	}

	// modifier · series · size (the resolved classification: curated override, else derived),
	// and whether the skill has a skill level in game. That's a per-skill property: Fediel's
	// Spine's Eclipse's Stamina has one, its Black Covenant doesn't. An unknown flag counts
	// as leveling.
	function metaParts(version: WeaponSkillVersion): string[] {
		const { modifier, series, size } = resolvedClassification(version)
		const parts = [modifier, series, size].filter((part): part is string => !!part)
		if (version.scalesWithSkillLevel !== false) parts.push(m.weapon_skills_skill_level())
		return parts
	}

	// The current locale's segments, else English; the raw text is the fallback for
	// responses without segments.
	function segmentsFor(version: WeaponSkillVersion) {
		const segments = version.descriptionSegments
		return segments?.[locale]?.length ? segments[locale] : (segments?.en ?? undefined)
	}

	function rawFor(version: WeaponSkillVersion): string | undefined {
		return version.description?.[locale]?.trim() || version.description?.en?.trim() || undefined
	}
</script>

{#each slots as slot (slot.position)}
	{@const [first, ...upgrades] = versions(slot)}
	{#if first}
		<SkillGroup title={m.weapon_skills_slot({ n: slot.position + 1 })}>
			<div class="skill-slot">
				{@render card(first, false)}
				{#each upgrades as version (version.ordinal)}
					{@render card(version, true)}
				{/each}
				{@render keyCard(keyFor(slot.position))}
			</div>
		</SkillGroup>
	{/if}
{/each}

{#snippet keyCard(keySlot: ReturnType<typeof keyFor>)}
	{#if keySlot}
		{@const { key, keyType } = keySlot}
		<SkillCard
			name={key ? localizedName(key.name) : m.weapon_key_none({ keyType })}
			iconUrl={key ? getWeaponKeyImage(key.slug) : undefined}
			relationLabel={keyType}
			linked
		/>
	{/if}
{/snippet}

{#snippet card(version: WeaponSkillVersion, linked: boolean)}
	{@const parts = metaParts(version)}
	<SkillCard
		name={localizedName(version.name)}
		iconUrl={getWeaponSkillIcon(version.iconStem, locale)}
		badges={[...(linked ? [] : unlockParts(version)), ...flags(version)]}
		segments={segmentsFor(version)}
		raw={rawFor(version)}
		relationLabel={linked ? unlockParts(version).join(' · ') : undefined}
		{linked}
		meta={parts.length ? metaLine : undefined}
	/>
	{#snippet metaLine()}
		<span>{parts.join(' · ')}</span>
	{/snippet}
{/snippet}
