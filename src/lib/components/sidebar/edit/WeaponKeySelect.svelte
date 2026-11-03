<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity'
	import * as m from '$lib/paraglide/messages'
	import { createQuery } from '@tanstack/svelte-query'
	import { weaponAdapter, type WeaponKey } from '$lib/api/adapters/weapon.adapter'
	import Select from '$lib/components/ui/Select.svelte'
	import { queryOptions } from '@tanstack/svelte-query'
	import { localizedName } from '$lib/utils/locale'
	import { getWeaponKeyImage } from '$lib/utils/images/weapons'
	import { formatUncapLevel } from '$lib/utils/modificationFormatters'
	import { weaponKeyTypeName } from '$lib/utils/weaponKeySlots'
	import Icon from '$lib/components/Icon.svelte'

	interface Props {
		/** The weapon series slug (determines which keys are available) */
		seriesSlug?: string
		/** The slot number (0, 1, or 2) */
		slot: number
		/** Currently selected weapon key ID */
		value?: string
		/** Called when selection changes */
		onchange?: (key: WeaponKey | undefined) => void
		/** Current transcendence step (for key validation) */
		transcendenceStep?: number
		/** The slot isn't open at the weapon's uncap */
		disabled?: boolean
		/** The weapon's uncap, for the locked slot's message */
		uncapLevel?: number
	}

	let {
		seriesSlug,
		slot,
		value = $bindable(),
		onchange,
		transcendenceStep = 0,
		disabled = false,
		uncapLevel = 0
	}: Props = $props()

	// Fetch weapon keys for this series slug and slot
	const weaponKeysQuery = createQuery(() =>
		queryOptions({
			queryKey: ['weaponKeys', 'slug', seriesSlug, slot] as const,
			queryFn: async () => {
				if (!seriesSlug) return []
				return weaponAdapter.getWeaponKeys({ seriesSlug, slot })
			},
			enabled: !!seriesSlug,
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		})
	)

	const keyTypeName = $derived(weaponKeyTypeName(seriesSlug, slot))

	// Group and sort weapon keys
	const groupedOptions = $derived.by(() => {
		const keys = weaponKeysQuery.data ?? []
		if (keys.length === 0) return []

		// Group by group property
		const groups = new SvelteMap<number, WeaponKey[]>()
		for (const key of keys) {
			const existing = groups.get(key.group) ?? []
			existing.push(key)
			groups.set(key.group, existing)
		}

		// Sort within groups and flatten
		const result: Array<{ value: string; label: string; disabled?: boolean; image?: string }> = []

		// Add "No key" option first
		result.push({
			value: '',
			label: m.weapon_key_none({ keyType: keyTypeName })
		})

		// Add grouped keys
		for (const [, groupKeys] of [...groups.entries()].sort((a, b) => a[0] - b[0])) {
			const sorted = groupKeys.sort((a, b) => a.order - b.order)
			for (const key of sorted) {
				// Check if key requires transcendence (specific granblue_ids)
				const requiresTranscendence = [14005, 14006, 14007].includes(key.granblue_id)
				const isDisabled = requiresTranscendence && transcendenceStep < 3

				result.push({
					value: key.id,
					label: localizedName(key.name),
					disabled: isDisabled,
					image: getWeaponKeyImage(key.slug)
				})
			}
		}

		return result
	})

	// Find the full weapon key object from ID
	function findKeyById(id: string | undefined): WeaponKey | undefined {
		if (!id) return undefined
		return (weaponKeysQuery.data ?? []).find((k: WeaponKey) => k.id === id)
	}

	function handleChange(newValue: string | undefined) {
		value = newValue
		onchange?.(findKeyById(newValue))
	}
</script>

<div class="weapon-key-select">
	{#if weaponKeysQuery.isPending}
		<div class="loading">{m.sidebar_loading_keys()}</div>
	{:else if weaponKeysQuery.error}
		<div class="error">{m.sidebar_keys_error()}</div>
	{:else}
		<Select
			options={groupedOptions}
			value={value ?? ''}
			onValueChange={handleChange}
			placeholder={m.weapon_key_select({ keyType: keyTypeName })}
			{disabled}
			size="medium"
			fullWidth
			contained
		/>
		{#if disabled}
			<p class="locked">
				<Icon name="lock" size={14} />
				{m.weapon_key_locked({ keyType: keyTypeName, uncap: formatUncapLevel(uncapLevel) })}
			</p>
		{/if}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.weapon-key-select {
		// A key's image: 32px, plus its 4px padding a side
		--key-image: 32px;
		width: 100%;

		:global(.image) {
			width: var(--key-image) !important;
			height: var(--key-image) !important;
			border-radius: layout.$item-corner-small !important;
			padding: 4px;
		}

		// Without a key (none picked, or a locked slot) the trigger stays as tall
		// as one with a key: the padded image, the medium padding and the 2px border
		:global([data-select-trigger]) {
			min-height: calc(var(--key-image) + 8px + spacing.$unit-2x + 4px);
		}
	}

	.locked {
		display: flex;
		align-items: center;
		gap: spacing.$unit-half;
		margin: spacing.$unit-half 0 0;
		padding: 0 spacing.$unit;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.loading,
	.error {
		padding: spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.error {
		color: var(--text-error);
	}
</style>
