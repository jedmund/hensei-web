<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import type { Awakening } from '$lib/types/api/entities'
	import { NO_AWAKENING } from '$lib/types/api/entities'
	import Select from '$lib/components/ui/Select.svelte'
	import Slider from '$lib/components/ui/Slider.svelte'
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
	let selectedId = $derived(value ? value.id || value.slug || NO_AWAKENING.id : NO_AWAKENING.id)
	let localLevel = $derived(level)

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

	// Slider clamps within [1, maxLevel] already, so no extra validation needed.
	function handleLevelChange(newLevel: number) {
		localLevel = newLevel
		onLevelChange?.(newLevel)
	}
</script>

<div class="awakening-select">
	<div class="awakening-type">
		<Select
			{options}
			value={selectedId}
			onValueChange={handleAwakeningChange}
			placeholder={m.placeholder_select_awakening()}
			size="medium"
			fullWidth
			contained
		/>
	</div>

	{#if !isNoAwakening}
		<DetailRow label={m.label_level_n({ level: String(localLevel) })} noPadding>
			<div class="level-slider">
				<Slider
					value={localLevel}
					min={1}
					max={maxLevel}
					step={1}
					onValueChange={handleLevelChange}
				/>
			</div>
		</DetailRow>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;

	.awakening-select {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.awakening-type {
		flex: 1;
	}

	// Give the slider enough room to feel draggable rather than crammed into
	// the DetailRow's right-aligned value cell.
	.level-slider {
		min-width: 160px;
		display: flex;
		align-items: center;
	}
</style>
