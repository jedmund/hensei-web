<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import type { WeaponKey } from '$lib/api/adapters/entity.adapter'
	import Select from '$lib/components/ui/Select.svelte'

	interface Props {
		/** The weapon series (determines which keys are available) */
		series: number
		/** The slot number (1, 2, or 3) */
		slot: number
		/** Currently selected weapon key ID */
		value?: string
		/** Called when selection changes */
		onchange?: (key: WeaponKey | undefined) => void
		/** Current transcendence step (for key validation) */
		transcendenceStep?: number
	}

	let { series, slot, value = $bindable(), onchange, transcendenceStep = 0 }: Props = $props()

	// Key type names based on series and slot (0-based indexing)
	const KEY_TYPE_NAMES: Record<number, Record<number, { en: string; ja: string }>> = {
		// Dark Opus (series 3)
		3: {
			0: { en: 'Pendulum', ja: 'ペンデュラム' },
			1: { en: 'Pendulum/Chain', ja: 'ペンデュラム/チェイン' }
		},
		// Draconic (series 27)
		27: {
			0: { en: 'Teluma', ja: 'テルマ' },
			1: { en: 'Teluma', ja: 'テルマ' }
		},
		// Ultima (series 13)
		13: {
			0: { en: 'Gauph Key', ja: 'ガフスキー' },
			1: { en: 'Ultima Key', ja: 'ガフスキーΩ' },
			2: { en: 'Gate of Omnipotence', ja: 'ガフスキー' }
		},
		// Astral (series 19)
		19: {
			0: { en: 'Emblem', ja: 'エンブレム' }
		},
		// Superlative (series 40)
		40: {
			0: { en: 'Teluma', ja: 'テルマ' },
			1: { en: 'Teluma', ja: 'テルマ' }
		}
	}

	// Fetch weapon keys for this series and slot
	const weaponKeysQuery = createQuery(() => entityQueries.weaponKeys({ series, slot }))

	// Get the key type name for this series/slot
	const keyTypeName = $derived(KEY_TYPE_NAMES[series]?.[slot]?.en ?? 'Key')

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
					label: key.name.en,
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
