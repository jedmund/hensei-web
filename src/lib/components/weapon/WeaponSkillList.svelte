<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { localizedName, appLocale } from '$lib/utils/locale'
	import { getWeaponSkillIcon } from '$lib/utils/images'
	import { wikiToHtml } from '$lib/utils/wikiText'
	import type { WeaponSkill, WeaponSkillVersion } from '$lib/types/api/entities'

	interface Props {
		skills: WeaponSkill[] | undefined
		/** Tighter layout (smaller icon, EN-only) for narrow contexts like the sidebar. */
		compact?: boolean
	}

	let { skills, compact = false }: Props = $props()

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

	// modifier · series · size — only present for standard grid-scaling skills.
	function scalingMeta(version: WeaponSkillVersion): string {
		return [version.skillModifier, version.skillSeries, version.skillSize]
			.filter(Boolean)
			.join(' · ')
	}

	// Hide an icon that 404s rather than showing a broken-image glyph.
	function hideBrokenIcon(event: Event) {
		;(event.currentTarget as HTMLImageElement).style.display = 'none'
	}
</script>

<div class="weapon-skill-list" class:compact>
	{#each slots as slot (slot.position)}
		<section class="slot">
			<h5 class="slot-title">{m.weapon_skills_slot({ n: slot.position + 1 })}</h5>
			{#each versions(slot) as version (version.ordinal)}
				{@const descriptionEn = version.description?.en?.trim()}
				{@const descriptionJa = version.description?.ja?.trim()}
				{@const meta = scalingMeta(version)}
				{@const iconUrl = getWeaponSkillIcon(version.iconStem, locale)}
				<div class="version-card">
					{#if iconUrl}
						<img
							class="icon"
							src={iconUrl}
							alt={localizedName(version.name)}
							loading="lazy"
							onerror={hideBrokenIcon}
						/>
					{/if}
					<div class="info">
						<div class="name-row">
							<span class="name">{localizedName(version.name)}</span>
							{#if !compact && version.name?.ja}
								<span class="name-jp">{version.name.ja}</span>
							{/if}
							<span class="badge tier">{tierLabel(version)}</span>
							{#if version.unlockLevel}
								<span class="badge">{m.weapon_skills_level({ n: version.unlockLevel })}</span>
							{/if}
							{#if version.mainHandOnly}
								<span class="badge flag">{m.weapon_skills_main_hand()}</span>
							{/if}
							{#if version.mcOnly}
								<span class="badge flag">{m.weapon_skills_mc_only()}</span>
							{/if}
						</div>
						{#if meta}
							<div class="meta">{meta}</div>
						{/if}
						{#if descriptionEn}
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- wikiToHtml emits only whitelisted tags -->
							<p class="description">{@html wikiToHtml(descriptionEn)}</p>
						{/if}
						{#if !compact && descriptionJa}
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- wikiToHtml emits only whitelisted tags -->
							<p class="description description-jp">{@html wikiToHtml(descriptionJa)}</p>
						{/if}
					</div>
				</div>
			{/each}
		</section>
	{/each}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.weapon-skill-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.slot {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.slot-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: 0;
	}

	.version-card {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$item-corner;
		padding: spacing.$unit 0;
	}

	.icon {
		flex: 0 0 auto;
		width: spacing.$unit-6x;
		height: spacing.$unit-6x;
		border-radius: layout.$item-corner-small;
		object-fit: contain;
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

	.name-jp {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.badge {
		font-size: typography.$font-tiny;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		background: var(--background);
		padding: 0 spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		line-height: 1.6;

		&.tier {
			color: var(--text-primary);
		}

		&.flag {
			font-style: italic;
		}
	}

	.meta {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.description {
		margin: 0;
		font-size: typography.$font-small;
		line-height: 1.5;
		color: var(--text-primary);
		white-space: pre-line;

		:global(strong) {
			font-weight: typography.$bold;
		}

		:global(em) {
			font-style: italic;
		}
	}

	.description-jp {
		color: var(--text-secondary);
	}

	// Sidebar / narrow layout
	.compact {
		gap: spacing.$unit-2x;

		.version-card {
			gap: spacing.$unit-half;
		}

		.icon {
			width: spacing.$unit-4x;
			height: spacing.$unit-4x;
		}

		.name {
			font-size: typography.$font-small;
		}
	}
</style>
