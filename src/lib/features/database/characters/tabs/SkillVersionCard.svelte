<script lang="ts">
	import type { CharacterSkillVersion, DescriptionSegment } from '$lib/types/api/entities'
	import { getCharacterSkillIcon } from '$lib/utils/images/icons'
	import { appLocale, localizedName } from '$lib/utils/locale'
	import SkillCard from '$lib/components/skills/SkillCard.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		version: CharacterSkillVersion
		/** Slot kind ('ability' | 'ougi' | 'support'); drives the static CA/support icon. */
		kind?: string
		/** Connector label shown above linked sub-cards (e.g. "Transforms into"). */
		relationLabel?: string
		/** Progression/role badge labels rendered next to the name. */
		badges?: string[]
		/** Linked sub-cards render indented and slightly smaller. */
		linked?: boolean
	}

	let { version, kind, relationLabel, badges = [], linked = false }: Props = $props()

	const iconUrl = $derived(getCharacterSkillIcon(version.gameIcon, kind))

	// The current locale's description as segments. Segments (effect hovercards, skill names)
	// exist for English only, so another locale with its own text shows that text plain; with
	// none, it falls back to English.
	const segments = $derived.by((): DescriptionSegment[] => {
		const locale = appLocale()
		const localized = version.descriptionSegments?.[locale]
		if (localized?.length) return localized
		const text = version.description?.[locale]?.trim()
		if (text) return [{ text }]
		if (version.descriptionSegments?.en?.length) return version.descriptionSegments.en
		const english = version.description?.en?.trim()
		return english ? [{ text: english }] : []
	})

	// "Cooldown 8 turns · Ready in 3 turns · Duration 3 turns" timing line.
	const timing = $derived.by(() => {
		const parts: string[] = []
		if (version.cooldown != null)
			parts.push(
				`${m.character_skills_cooldown()} ${m.character_skills_turns({ n: version.cooldown })}`
			)
		if (version.initialCooldown != null)
			parts.push(m.character_skills_initial_cooldown_value({ n: version.initialCooldown }))
		const duration = formatDuration(version.durationValue, version.durationUnit)
		if (duration) parts.push(`${m.character_skills_duration()} ${duration}`)
		return parts
	})

	function formatDuration(
		value: number | null | undefined,
		unit: string | null | undefined
	): string {
		if (value == null) return ''
		switch (unit) {
			case 'turns':
			case 'half_turns':
				return m.character_skills_turns({ n: value })
			case 'seconds':
				return m.character_skills_seconds({ n: value })
			default:
				return String(value)
		}
	}

	const triggerText = $derived.by(() => {
		if (!version.triggerType || version.triggerType === 'none') return ''
		return version.triggerValue
			? `${version.triggerType} · ${version.triggerValue}`
			: version.triggerType
	})
</script>

<SkillCard
	name={localizedName(version.name)}
	{iconUrl}
	iconType={version.typeColor ?? undefined}
	{badges}
	{segments}
	effects={version.skillEffects}
	{relationLabel}
	{linked}
	meta={timing.length || triggerText ? timingMeta : undefined}
/>

{#snippet timingMeta()}
	{#if timing.length}<span>{timing.join(' · ')}</span>{/if}
	{#if triggerText}<span class="trigger">{triggerText}</span>{/if}
{/snippet}

<style lang="scss">
	.trigger {
		font-style: italic;
	}
</style>
