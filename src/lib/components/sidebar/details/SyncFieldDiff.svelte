<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon } from '$lib/types/api/party'
	import type {
		CollectionCharacter,
		CollectionWeapon,
		CollectionSummon
	} from '$lib/types/api/collection'
	import UncapIndicator from '$lib/components/uncap/UncapIndicator.svelte'
	import TranscendenceStar from '$lib/components/uncap/TranscendenceStar.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'
	import { localizedName } from '$lib/utils/locale'

	type GridItem = GridCharacter | GridWeapon | GridSummon
	type CollectionItem = CollectionCharacter | CollectionWeapon | CollectionSummon

	interface Props {
		fieldKey: string
		type: 'character' | 'weapon' | 'summon'
		gridItem: GridItem
		collectionItem: CollectionItem
	}

	let { fieldKey, type, gridItem, collectionItem }: Props = $props()

	// Resolve uncap capabilities so the indicator renders the right number of stars.
	const uncapCaps = $derived.by(() => {
		if (type === 'character') {
			const uncap = (gridItem as GridCharacter).character?.uncap
			return {
				flb: uncap?.flb,
				ulb: uncap?.transcendence,
				transcendence: uncap?.transcendence ?? false
			}
		}
		if (type === 'weapon') {
			const uncap = (gridItem as GridWeapon).weapon?.uncap
			return { flb: uncap?.flb, ulb: uncap?.ulb, transcendence: uncap?.transcendence ?? false }
		}
		const uncap = (gridItem as GridSummon).summon?.uncap
		return { flb: uncap?.flb, ulb: uncap?.ulb, transcendence: uncap?.transcendence ?? false }
	})

	const special = $derived(
		type === 'character' ? ((gridItem as GridCharacter).character?.special ?? false) : false
	)

	// Hide the transcendence diff row entirely when the underlying entity
	// can't transcend — there's no meaningful before/after to show.
	const shouldRender = $derived(
		fieldKey !== 'transcendenceStep' || uncapCaps.transcendence === true
	)

	function awakeningText(
		item: GridCharacter | GridWeapon | CollectionCharacter | CollectionWeapon
	) {
		const aw = item.awakening
		if (!aw || !aw.type) return m.sync_diff_empty()
		const name = localizedName(aw.type.name)
		const level = aw.level ?? 1
		return `${name} Lv${level}`
	}

	function ringText(ring: { modifier: number; strength: number } | null | undefined): string {
		if (!ring || !ring.modifier) return m.sync_diff_empty()
		return `+${ring.strength}`
	}

	function statModifierName(mod: { nameEn?: string; nameJp?: string } | null | undefined): string {
		if (!mod) return m.sync_diff_empty()
		return localizedName({ en: mod.nameEn ?? '', ja: mod.nameJp ?? '' })
	}

	function weaponKeyName(slot: number, item: GridWeapon | CollectionWeapon): string {
		const key = item.weaponKeys?.find((k) => k.slot === slot - 1)
		return key ? localizedName(key.name) : m.sync_diff_empty()
	}

	function axText(index: number, item: GridWeapon | CollectionWeapon): string {
		const skill = item.ax?.[index]
		if (!skill || !skill.modifier) return m.sync_diff_empty()
		return `${statModifierName(skill.modifier)} +${skill.strength}`
	}

	function bulletAtPosition(position: number, item: GridWeapon | CollectionWeapon) {
		return item.bullets?.find((b) => b.position === position)
	}

	// Label for the field key, including the row index for relational sets.
	const label = $derived.by(() => {
		if (fieldKey === 'uncapLevel') return m.sync_diff_uncap()
		if (fieldKey === 'transcendenceStep') return m.sync_diff_transcendence()
		if (fieldKey === 'perpetuity') return m.sync_diff_perpetuity()
		if (fieldKey === 'awakeningId' || fieldKey === 'awakeningLevel') return m.sync_diff_awakening()
		if (fieldKey === 'aetherialMastery') return m.sync_diff_aetherial_mastery()
		if (fieldKey === 'element') return m.sync_diff_element()
		if (fieldKey === 'befoulmentModifier') return m.sync_diff_befoulment_modifier()
		if (fieldKey === 'befoulmentStrength') return m.sync_diff_befoulment_strength()
		if (fieldKey === 'exorcismLevel') return m.sync_diff_exorcism_level()
		if (fieldKey.startsWith('overMastery.')) {
			const i = Number(fieldKey.split('.')[1])
			return m.sync_diff_over_mastery({ index: String(i + 1) })
		}
		if (fieldKey.startsWith('weaponKey')) {
			const slot = Number(fieldKey.slice('weaponKey'.length))
			return m.sync_diff_weapon_key({ index: String(slot) })
		}
		if (fieldKey.startsWith('ax.')) {
			const i = Number(fieldKey.split('.')[1])
			return m.sync_diff_ax({ index: String(i + 1) })
		}
		if (fieldKey.startsWith('bullets.')) {
			const i = Number(fieldKey.split('.')[1])
			return m.sync_diff_bullet({ index: String(i + 1) })
		}
		return fieldKey
	})
</script>

{#if shouldRender}
	<div class="diff-row">
		<span class="diff-label">{label}</span>
		<div class="diff-values">
			{#if fieldKey === 'uncapLevel'}
				<UncapIndicator
					{type}
					uncapLevel={collectionItem.uncapLevel}
					transcendenceStage={collectionItem.transcendenceStep}
					flb={uncapCaps.flb}
					ulb={uncapCaps.ulb}
					transcendence={uncapCaps.transcendence}
					{special}
					hideTranscendence
				/>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<UncapIndicator
					{type}
					uncapLevel={gridItem.uncapLevel}
					transcendenceStage={gridItem.transcendenceStep}
					flb={uncapCaps.flb}
					ulb={uncapCaps.ulb}
					transcendence={uncapCaps.transcendence}
					{special}
					hideTranscendence
				/>
			{:else if fieldKey === 'transcendenceStep'}
				<span class="trans-row">
					<TranscendenceStar stage={collectionItem.transcendenceStep ?? 0} {type} />
					<span class="trans-level"
						>{m.details_transcendence_level({
							level: String(collectionItem.transcendenceStep ?? 0)
						})}</span
					>
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="trans-row">
					<TranscendenceStar stage={gridItem.transcendenceStep ?? 0} {type} />
					<span class="trans-level"
						>{m.details_transcendence_level({
							level: String(gridItem.transcendenceStep ?? 0)
						})}</span
					>
				</span>
			{:else if fieldKey === 'perpetuity'}
				<span class="text-value">
					{(collectionItem as CollectionCharacter).perpetuity
						? m.sync_diff_enabled()
						: m.sync_diff_disabled()}
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">
					{(gridItem as GridCharacter).perpetuity ? m.sync_diff_enabled() : m.sync_diff_disabled()}
				</span>
			{:else if fieldKey === 'awakeningId' || fieldKey === 'awakeningLevel'}
				<span class="text-value">{awakeningText(collectionItem as CollectionCharacter)}</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">{awakeningText(gridItem as GridCharacter)}</span>
			{:else if fieldKey.startsWith('overMastery.')}
				{@const idx = Number(fieldKey.split('.')[1])}
				<span class="text-value">
					{ringText((collectionItem as CollectionCharacter).overMastery?.[idx])}
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">
					{ringText((gridItem as GridCharacter).overMastery?.[idx])}
				</span>
			{:else if fieldKey === 'aetherialMastery'}
				<span class="text-value">
					{ringText((collectionItem as CollectionCharacter).aetherialMastery)}
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">
					{ringText((gridItem as GridCharacter).aetherialMastery)}
				</span>
			{:else if fieldKey === 'element'}
				<ElementLabel element={(collectionItem as CollectionWeapon).element} size="small" />
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<ElementLabel element={(gridItem as GridWeapon).element} size="small" />
			{:else if fieldKey.startsWith('weaponKey')}
				{@const slot = Number(fieldKey.slice('weaponKey'.length))}
				<span class="text-value">{weaponKeyName(slot, collectionItem as CollectionWeapon)}</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">{weaponKeyName(slot, gridItem as GridWeapon)}</span>
			{:else if fieldKey.startsWith('ax.')}
				{@const idx = Number(fieldKey.split('.')[1])}
				<span class="text-value">{axText(idx, collectionItem as CollectionWeapon)}</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">{axText(idx, gridItem as GridWeapon)}</span>
			{:else if fieldKey === 'befoulmentModifier'}
				<span class="text-value">
					{statModifierName((collectionItem as CollectionWeapon).befoulment?.modifier)}
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">
					{statModifierName((gridItem as GridWeapon).befoulment?.modifier)}
				</span>
			{:else if fieldKey === 'befoulmentStrength'}
				<span class="text-value">
					{(collectionItem as CollectionWeapon).befoulment?.strength ?? m.sync_diff_empty()}
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">
					{(gridItem as GridWeapon).befoulment?.strength ?? m.sync_diff_empty()}
				</span>
			{:else if fieldKey === 'exorcismLevel'}
				<span class="text-value">
					{(collectionItem as CollectionWeapon).befoulment?.exorcismLevel ?? 0}
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">
					{(gridItem as GridWeapon).befoulment?.exorcismLevel ?? 0}
				</span>
			{:else if fieldKey.startsWith('bullets.')}
				{@const pos = Number(fieldKey.split('.')[1])}
				{@const fromBullet = bulletAtPosition(pos, collectionItem as CollectionWeapon)}
				{@const toBullet = bulletAtPosition(pos, gridItem as GridWeapon)}
				<span class="text-value">
					{fromBullet ? localizedName(fromBullet.bullet.name) : m.sync_diff_empty()}
				</span>
				<Icon name="arrow-right" size={14} class="diff-arrow" />
				<span class="text-value">
					{toBullet ? localizedName(toBullet.bullet.name) : m.sync_diff_empty()}
				</span>
			{:else}
				<span class="text-value">{m.sync_diff_empty()}</span>
				<span aria-hidden="true"></span>
				<span class="text-value">{m.sync_diff_empty()}</span>
			{/if}
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	// Lay each cell directly into the parent .diff-list grid so column widths
	// are shared across rows + header (Collection/Team labels line up with the
	// values below them).
	.diff-row {
		display: contents;
	}

	.diff-label {
		font-size: typography.$font-small;
		color: var(--text-secondary);
		padding: spacing.$unit 0;
	}

	.diff-values {
		display: contents;
		font-size: typography.$font-small;
		color: var(--text-primary);
	}

	:global(.diff-arrow) {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.text-value {
		font-weight: 500;
	}

	.trans-row {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit-half;
	}

	.trans-level {
		font-size: typography.$font-small;
		font-weight: 500;
	}
</style>
