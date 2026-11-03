<script lang="ts">
	import { getWeaponKeyImages } from '$lib/utils/modifiers'
	import type { WeaponKey } from '$lib/types/api/entities'
	import type { LocalizedName } from '$lib/types/api/entities'
	import { localizedName } from '$lib/utils/locale'
	import type { WeaponSeriesRef, WeaponSeriesSummary } from '$lib/types/api/weaponSeries'
	import * as m from '$lib/paraglide/messages'
	import { activeKeySkill } from '$lib/utils/weaponKeySlots'
	import SkillDescription from '$lib/components/weapon/SkillDescription.svelte'
	import { appLocale } from '$lib/utils/locale'

	interface Props {
		weaponKeys?: WeaponKey[]
		weaponData?: {
			element?: number
			proficiency?: number | number[]
			series?: WeaponSeriesRef | WeaponSeriesSummary | null
			name?: LocalizedName
		}
		layout?: 'list' | 'grid'
		/** Makes each key a button (the details pane opens its skill in the Skills tab) */
		onSelect?: ((key: WeaponKey) => void) | undefined
		/** The copy's uncap and transcendence: each key shows its skill at that tier */
		uncapLevel?: number | undefined
		transcendenceStep?: number | undefined
	}

	let {
		weaponKeys,
		weaponData,
		layout = 'list',
		onSelect,
		uncapLevel,
		transcendenceStep
	}: Props = $props()

	const locale = $derived(appLocale())

	function skillFor(key: WeaponKey) {
		if (uncapLevel === undefined) return undefined
		const version = activeKeySkill(key.skillVersions, uncapLevel, transcendenceStep ?? 0)
		if (!version) return undefined
		const segments = version.descriptionSegments
		return {
			segments: segments?.[locale]?.length ? segments[locale] : (segments?.en ?? undefined),
			raw: version.description?.[locale]?.trim() || version.description?.en?.trim() || undefined
		}
	}

	const proficiency = $derived(
		Array.isArray(weaponData?.proficiency) ? weaponData?.proficiency[0] : weaponData?.proficiency
	)
	let keyImages = $derived(getWeaponKeyImages(weaponKeys, proficiency))

	function getKeyDescription(key: WeaponKey): string {
		const name = localizedName(key.name)
		if (name !== '—') return name
		return key.slug || m.details_weapon_key_fallback()
	}
</script>

{#if weaponKeys && weaponKeys.length > 0}
	<div class="weapon-keys-list {layout}">
		{#each weaponKeys as key, index (index)}
			{@const imageData = keyImages[index]}
			{#if onSelect}
				<button type="button" class="weapon-key-item selectable" onclick={() => onSelect(key)}>
					{@render item(key, imageData)}
				</button>
			{:else}
				<div class="weapon-key-item">
					{@render item(key, imageData)}
				</div>
			{/if}
		{/each}
	</div>
{/if}

{#snippet item(key: WeaponKey, imageData: (typeof keyImages)[number] | undefined)}
	{#if imageData}
		<img src={imageData.url} alt={imageData.alt} class="weapon-key-icon" />
	{/if}
	{@const skill = skillFor(key)}
	<div class="weapon-key-info">
		<span class="key-name">
			{getKeyDescription(key)}
		</span>
		{#if skill}
			<SkillDescription segments={skill.segments} raw={skill.raw} class="skill-effect" />
		{/if}
	</div>
{/snippet}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.weapon-keys-list {
		display: flex;
		gap: spacing.$unit;

		&.list {
			flex-direction: column;
		}

		&.grid {
			flex-wrap: wrap;
			gap: spacing.$unit-2x;
		}

		.weapon-key-item {
			display: flex;
			gap: spacing.$unit-2x;
			// The key's skill can run to a few lines; the icon stays at the top
			align-items: flex-start;
			padding: spacing.$unit;
			background: var(--unit-bg);
			border-radius: layout.$item-corner;
			transition: background 0.2s ease;

			&:hover {
				background: var(--placeholder-bg);
			}

			&.selectable {
				all: unset;
				box-sizing: border-box;
				display: flex;
				gap: spacing.$unit-2x;
				align-items: flex-start;
				padding: spacing.$unit;
				background: var(--unit-bg);
				border-radius: layout.$item-corner;
				cursor: pointer;
				transition: background 0.2s ease;

				&:hover {
					background: var(--placeholder-bg);
				}

				&:focus-visible {
					outline: 2px solid var(--accent-blue);
				}
			}

			.weapon-key-icon {
				width: spacing.$unit-5x;
				height: spacing.$unit-5x;
				border-radius: layout.$item-corner-small;
				flex-shrink: 0;
			}

			.weapon-key-info {
				display: flex;
				flex-direction: column;
				gap: spacing.$unit-fourth;

				:global(.skill-effect) {
					font-size: typography.$font-small;
					color: var(--text-secondary);
				}

				.key-name {
					font-size: typography.$font-small;
					color: var(--text-primary);
					font-weight: typography.$medium;
				}
			}
		}
	}

	.grid {
		.weapon-key-item {
			flex-direction: column;
			text-align: center;
			padding: spacing.$unit-2x;

			.weapon-key-icon {
				width: spacing.$unit-6x;
				height: spacing.$unit-6x;
			}

			.weapon-key-info {
				align-items: center;
			}
		}
	}
</style>
