
<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Awakening } from '$lib/types/api/entities'
	import { NO_AWAKENING } from '$lib/types/api/entities'
	import Select from '$lib/components/ui/Select.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import DetailRow from '$lib/components/sidebar/details/DetailRow.svelte'
	import { getAwakeningImage } from '$lib/utils/modifiers'
	import { localizedName } from '$lib/utils/locale'

	interface Props {
		/** Available awakenings for the weapon */
		awakenings: Awakening[]
		/** Currently selected awakening */
		value?: Awakening
		/** Current awakening level */
		level?: number
		/** Maximum awakening level for the weapon */
		maxLevel: number
		/** Called when awakening type changes */
		onAwakeningChange?: (awakening: Awakening | undefined) => void
		/** Called when awakening level changes */
		onLevelChange?: (level: number) => void
	}

	let {
		awakenings,
		value = undefined,
		level = 1,
		maxLevel,
		onAwakeningChange,
		onLevelChange
	}: Props = $props()

	// Local state derived from props — overrides are temporary until props change
	let selectedId = $derived(value ? (value.id || value.slug || NO_AWAKENING.id) : NO_AWAKENING.id)
	let localLevel = $derived(level)

	// Error state for level input
	let levelError = $state('')

	// Helper to get a unique identifier for an awakening (use id if available, fallback to slug)
	function getAwakeningKey(awk: Awakening): string {
		return awk.id || awk.slug || 'unknown'
	}

	// Build options list with NO_AWAKENING first
	const options = $derived.by(() => {
		const sorted = [...awakenings].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
		const items: Array<{ value: string; label: string; image?: string }> = sorted.map((awk) => {
			const img = getAwakeningImage({ type: awk, level: 1 })
			return {
				value: getAwakeningKey(awk),
				label: localizedName(awk.name),
				image: img ?? undefined
			}
		})

		// Add NO_AWAKENING at the beginning if not already present
		if (!awakenings.find((a) => getAwakeningKey(a) === NO_AWAKENING.id)) {
			items.unshift({
				value: NO_AWAKENING.id,
				label: localizedName(NO_AWAKENING.name)
			})
		}

		return items
	})

	// Is the current selection the "No awakening" option?
	const isNoAwakening = $derived(selectedId === NO_AWAKENING.id)

	// Handle awakening type change
	function handleAwakeningChange(newId: string | undefined) {
		if (!newId) {
			selectedId = NO_AWAKENING.id
			onAwakeningChange?.(undefined)
			return
		}

		selectedId = newId

		if (selectedId === NO_AWAKENING.id) {
			onAwakeningChange?.(undefined)
		} else {
			// Find by id first, then by slug (for awakenings with null id)
			const selected = awakenings.find((a) => getAwakeningKey(a) === selectedId)
			onAwakeningChange?.(selected)
		}
	}

	// Handle level change with validation
	function handleLevelChange(event: Event) {
		const input = event.target as HTMLInputElement
		const newLevel = parseInt(input.value, 10)

		// Validate the level
		if (isNaN(newLevel)) {
			levelError = 'Please enter a valid number'
			return
		}

		if (newLevel < 1) {
			levelError = 'Level must be at least 1'
			return
		}

		if (newLevel > maxLevel) {
			levelError = `Level cannot exceed ${maxLevel}`
			return
		}

		if (!Number.isInteger(newLevel)) {
			levelError = 'Level must be a whole number'
			return
		}

		levelError = ''
		localLevel = newLevel
		onLevelChange?.(newLevel)
	}
</script>

<div class="awakening-select">
	<div class="awakening-type">
		<Select
			options={options}
			value={selectedId}
			onValueChange={handleAwakeningChange}
			placeholder={m.placeholder_select_awakening()}
			size="medium"
			fullWidth
			contained
		/>
	</div>

	{#if !isNoAwakening}
		<DetailRow label={m.label_level()} noHover noPadding>
			<Input
				type="number"
				min={1}
				max={maxLevel}
				step={1}
				value={localLevel}
				oninput={handleLevelChange}
				error={levelError || undefined}
				contained
				variant="number"
				placeholder="1~{maxLevel}"
			/>
		</DetailRow>
	{/if}

	{#if levelError}
		<p class="level-error">{levelError}</p>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.awakening-select {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.awakening-type {
		flex: 1;
	}

	.level-error {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--danger);
	}
</style>
