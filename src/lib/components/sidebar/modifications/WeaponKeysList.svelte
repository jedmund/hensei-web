<script lang="ts">
	import { getWeaponKeyImages } from '$lib/utils/modifiers'
	import type { WeaponKey } from '$lib/types/api/entities'
	import type { LocalizedName } from '$lib/types/api/entities'
	import { localizedName } from '$lib/utils/locale'
	import type { WeaponSeriesRef, WeaponSeriesSummary } from '$lib/types/api/weaponSeries'
	import * as m from '$lib/paraglide/messages'
	import { skillPositionForKeySlot } from '$lib/utils/weaponKeySlots'

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
	}

	let { weaponKeys, weaponData, layout = 'list', onSelect }: Props = $props()

	const proficiency = $derived(
		Array.isArray(weaponData?.proficiency) ? weaponData?.proficiency[0] : weaponData?.proficiency
	)
	let keyImages = $derived(getWeaponKeyImages(weaponKeys, proficiency))

	function getKeyDescription(key: WeaponKey): string {
		const name = localizedName(key.name)
		if (name !== '—') return name
		return key.slug || m.details_weapon_key_fallback()
	}

	// The weapon skill the key fills (an Opus's first Pendulum is its Skill 2)
	function getSlotLabel(slot: number): string {
		const position = skillPositionForKeySlot(weaponData?.series?.slug, slot) ?? slot
		return m.details_skill_slot({ slot: String(position + 1) })
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
	<div class="weapon-key-info">
		<span class="slot-label">
			{getSlotLabel(key.slot)}
		</span>
		<span class="key-name">
			{getKeyDescription(key)}
		</span>
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
			align-items: center;
			padding: spacing.$unit;
			background: var(--unit-bg);
			border-radius: layout.$item-corner-small;
			transition: background 0.2s ease;

			&:hover {
				background: var(--placeholder-bg);
			}

			&.selectable {
				all: unset;
				box-sizing: border-box;
				display: flex;
				gap: spacing.$unit-2x;
				align-items: center;
				padding: spacing.$unit;
				background: var(--unit-bg);
				border-radius: layout.$item-corner-small;
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

				.slot-label {
					font-size: typography.$font-tiny;
					color: var(--text-tertiary);
					text-transform: uppercase;
					letter-spacing: 0.3px;
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
