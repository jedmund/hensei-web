<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import type { WeaponKey } from '$lib/api/adapters/entity.adapter'
	import Select from '$lib/components/ui/Select.svelte'
	import { queryOptions } from '@tanstack/svelte-query'
	import { localizedName } from '$lib/utils/locale'

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
	}

	let { seriesSlug, slot, value = $bindable(), onchange, transcendenceStep = 0 }: Props = $props()

	// Key type names based on series slug and slot (0-based indexing)
	const KEY_TYPE_NAMES: Record<string, Record<number, { en: string; ja: string }>> = {
		// Dark Opus
		'dark-opus': {
			0: { en: 'Pendulum', ja: 'ペンデュラム' },
			1: { en: 'Pendulum/Chain', ja: 'ペンデュラム/チェイン' }
		},
		// Draconic
		'draconic': {
			0: { en: 'Teluma', ja: 'テルマ' },
			1: { en: 'Teluma', ja: 'テルマ' }
		},
		// Draconic Providence
		'draconic-providence': {
			0: { en: 'Teluma', ja: 'テルマ' },
			1: { en: 'Teluma', ja: 'テルマ' }
		},
		// Ultima
		'ultima': {
			0: { en: 'Gauph Key', ja: 'ガフスキー' },
			1: { en: 'Ultima Key', ja: 'ガフスキーΩ' },
			2: { en: 'Gate of Omnipotence', ja: 'ガフスキー' }
		},
		// Superlative
		'superlative': {
			0: { en: 'Teluma', ja: 'テルマ' },
			1: { en: 'Teluma', ja: 'テルマ' }
		}
	}

	// Fetch weapon keys for this series slug and slot
	const weaponKeysQuery = createQuery(() =>
		queryOptions({
			queryKey: ['weaponKeys', 'slug', seriesSlug, slot] as const,
			queryFn: async () => {
				if (!seriesSlug) return []
				return entityAdapter.getWeaponKeys({ seriesSlug, slot })
			},
			enabled: !!seriesSlug,
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		})
	)

	// Get the key type name for this series/slot
	const keyTypeName = $derived(seriesSlug ? (KEY_TYPE_NAMES[seriesSlug]?.[slot]?.en ?? 'Key') : 'Key')

	// Group and sort weapon keys
	const groupedOptions = $derived.by(() => {
		const keys = weaponKeysQuery.data ?? []
		if (keys.length === 0) return []

		// Group by group property
		const groups = new Map<number, WeaponKey[]>()
		for (const key of keys) {
			const existing = groups.get(key.group) ?? []
			existing.push(key)
			groups.set(key.group, existing)
		}

		// Sort within groups and flatten
		const result: Array<{ value: string; label: string; disabled?: boolean }> = []

		// Add "No key" option first
		result.push({
			value: '',
			label: `No ${keyTypeName}`
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
					disabled: isDisabled
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
		<div class="loading">Loading keys...</div>
	{:else if weaponKeysQuery.error}
		<div class="error">Failed to load keys</div>
	{:else}
		<Select
			options={groupedOptions}
			value={value ?? ''}
			onValueChange={handleChange}
			placeholder={`Select ${keyTypeName}`}
			size="medium"
			fullWidth
			contained
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.weapon-key-select {
		width: 100%;
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
