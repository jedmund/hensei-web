<script lang="ts">
	/**
	 * WeaponKeysSection - A weapon's keys (pendulums, telumas, …), with an
	 * inline editor for the party owner.
	 */
	import type { ComponentProps } from 'svelte'
	import type { GridWeapon } from '$lib/types/api/party'
	import DetailsSection from './DetailsSection.svelte'
	import SyncMenuButton from './SyncMenuButton.svelte'
	import WeaponKeysList from '../modifications/WeaponKeysList.svelte'
	import WeaponKeySelect from '$lib/components/sidebar/edit/WeaponKeySelect.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { formatUncapLevel, getWeaponKeyTitle } from '$lib/utils/modificationFormatters'
	import { getSeriesSlug } from '$lib/utils/weaponSeries'
	import { keySlots, openKeySlots } from '$lib/utils/weaponKeySlots'
	import { isWeaponSeriesRef } from '$lib/types/api/weaponSeries'
	import { useUpdateGridWeapon } from '$lib/api/mutations/gridWeapon.mutations'
	import { partyStore } from '$lib/stores/partyStore.svelte'
	import * as m from '$lib/paraglide/messages'

	type ElementColor = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		weapon: GridWeapon
		/** Whether the weapon has any keys set */
		hasWeaponKeys: boolean
		isPartyOwner: boolean
		/** Element for the Change/Save button */
		buttonElement: ElementColor | undefined
		/** Section sync button props; omit when the section is in sync */
		sync?: ComponentProps<typeof SyncMenuButton> | undefined
	}

	let { weapon, hasWeaponKeys, isPartyOwner, buttonElement, sync }: Props = $props()

	const updateWeaponMutation = useUpdateGridWeapon()
	let showWeaponKeyEditor = $state(false)
	let editKey1 = $state<string | undefined>(undefined)
	let editKey2 = $state<string | undefined>(undefined)
	let editKey3 = $state<string | undefined>(undefined)

	const seriesSlug = $derived(getSeriesSlug(weapon.weapon?.series))
	// Only slots this copy's uncap has opened (a Pendulum needs a 4★ Opus)
	const openSlots = $derived.by(() => {
		const series = weapon.weapon?.series
		return isWeaponSeriesRef(series) ? openKeySlots(series, weapon.uncapLevel ?? 0) : []
	})
	// Slots the uncap hasn't opened still show, disabled
	const allSlots = $derived.by(() => {
		const series = weapon.weapon?.series
		return isWeaponSeriesRef(series) ? keySlots(series) : []
	})

	// A keyed weapon whose uncap opens none of its slots yet
	const keysLocked = $derived.by(() => {
		const series = weapon.weapon?.series
		return isWeaponSeriesRef(series) && (series.numWeaponKeys ?? 0) > 0 && openSlots.length === 0
	})

	function startEditing() {
		editKey1 = weapon.weaponKeys?.find((k) => k.slot === 0)?.id
		editKey2 = weapon.weaponKeys?.find((k) => k.slot === 1)?.id
		editKey3 = weapon.weaponKeys?.find((k) => k.slot === 2)?.id
		showWeaponKeyEditor = true
	}

	function handleWeaponKeySave() {
		const shortcode = partyStore.party?.shortcode
		if (!weapon.id || !shortcode) return

		const updates: Record<string, unknown> = {}
		if (editKey1 !== undefined) updates.weaponKey1Id = editKey1
		if (editKey2 !== undefined) updates.weaponKey2Id = editKey2
		if (editKey3 !== undefined) updates.weaponKey3Id = editKey3

		updateWeaponMutation.mutate({
			id: weapon.id,
			partyShortcode: shortcode,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- partial update only needs key fields
			updates: updates as any
		})
		showWeaponKeyEditor = false
	}
</script>

<DetailsSection
	title={getWeaponKeyTitle(weapon.weapon?.series)}
	empty={!hasWeaponKeys && !showWeaponKeyEditor}
	emptyMessage={keysLocked
		? m.details_weapon_keys_locked({
				keys: getWeaponKeyTitle(weapon.weapon?.series),
				uncap: formatUncapLevel(weapon.uncapLevel)
			})
		: m.details_weapon_keys_not_set()}
>
	{#snippet action()}
		<div class="section-actions">
			{#if sync}
				<SyncMenuButton {...sync} />
			{/if}
			{#if isPartyOwner && keysLocked}
				<Button
					variant="element-ghost"
					size="small"
					element={buttonElement}
					leftIcon="lock"
					disabled
				>
					{m.action_change()}
				</Button>
			{:else if isPartyOwner && openSlots.length > 0}
				<Button
					variant="element-ghost"
					size="small"
					element={buttonElement}
					onclick={() => {
						if (showWeaponKeyEditor) {
							handleWeaponKeySave()
						} else {
							startEditing()
						}
					}}
				>
					{showWeaponKeyEditor ? m.action_save() : m.action_change()}
				</Button>
			{/if}
		</div>
	{/snippet}
	{#if showWeaponKeyEditor}
		<div class="key-selects">
			{#if allSlots.includes(0)}
				<WeaponKeySelect
					{seriesSlug}
					slot={0}
					bind:value={editKey1}
					transcendenceStep={weapon.transcendenceStep ?? 0}
					disabled={!openSlots.includes(0)}
				/>
			{/if}
			{#if allSlots.includes(1)}
				<WeaponKeySelect
					{seriesSlug}
					slot={1}
					bind:value={editKey2}
					transcendenceStep={weapon.transcendenceStep ?? 0}
					disabled={!openSlots.includes(1)}
				/>
			{/if}
			{#if allSlots.includes(2)}
				<WeaponKeySelect
					{seriesSlug}
					slot={2}
					bind:value={editKey3}
					transcendenceStep={weapon.transcendenceStep ?? 0}
					disabled={!openSlots.includes(2)}
				/>
			{/if}
		</div>
	{:else}
		<WeaponKeysList weaponKeys={weapon.weaponKeys} weaponData={weapon.weapon} layout="list" />
	{/if}
</DetailsSection>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.key-selects {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.section-actions {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
	}
</style>
