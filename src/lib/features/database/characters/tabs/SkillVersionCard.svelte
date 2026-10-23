<script lang="ts">
	import type { CharacterSkillVersion, DescriptionSegment } from '$lib/types/api/entities'
	import { getCharacterSkillIcon } from '$lib/utils/images'
	import { appLocale, localizedName } from '$lib/utils/locale'
	import SkillDescription from '$lib/components/weapon/SkillDescription.svelte'
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
	let imgFailed = $state(false)
	const showImg = $derived(!!iconUrl && !imgFailed)
	const typeColor = $derived(version.typeColor ?? 'none')

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

<div class="version-card" class:linked>
	{#if relationLabel}
		<div class="relation">↳ {relationLabel}</div>
	{/if}
	<div class="body">
		<div class="icon" data-type={typeColor}>
			{#if showImg}
				<img src={iconUrl} alt={localizedName(version.name)} onerror={() => (imgFailed = true)} />
			{/if}
		</div>
		<div class="info">
			<div class="name-row">
				<span class="name">{localizedName(version.name)}</span>
				{#each badges as badge (badge)}
					<span class="badge">{badge}</span>
				{/each}
			</div>

			{#if segments.length}
				<div class="description">
					<SkillDescription {segments} effects={version.skillEffects} />
				</div>
			{/if}

			{#if timing.length || triggerText}
				<div class="meta">
					{#if timing.length}<span class="timing">{timing.join(' · ')}</span>{/if}
					{#if triggerText}<span class="trigger">{triggerText}</span>{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.version-card {
		background: var(--card-bg);
		border-radius: layout.$item-corner;

		&.linked {
			margin-left: spacing.$unit-2x;
			padding-left: spacing.$unit-2x;
			border-left: 2px solid var(--separator-bg);
		}
	}

	.relation {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		padding: spacing.$unit-half 0;
	}

	.body {
		display: flex;
		gap: spacing.$unit * 1.5;
		padding: spacing.$unit;
	}

	.icon {
		flex: 0 0 auto;
		width: 40px;
		height: 40px;
		border-radius: layout.$item-corner-small;
		overflow: hidden;
		// Type-color border/fill fallback when no image is available.
		background: var(--background);

		&[data-type='damage'] {
			background: #d64545;
		}
		&[data-type='heal'] {
			background: #3fa34d;
		}
		&[data-type='buff'] {
			background: #e0a93b;
		}
		&[data-type='debuff'] {
			background: #4a6fd6;
		}
		&[data-type='field'] {
			background: #8b5cf6;
		}

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.name-row {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: spacing.$unit-half spacing.$unit;
	}

	.name {
		font-size: typography.$font-medium;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}

	.badge {
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		background: var(--background);
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		line-height: 1.6;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.trigger {
		font-style: italic;
	}

	.description {
		font-size: typography.$font-regular;
		line-height: 1.5;
		color: var(--text-primary);
	}
</style>
