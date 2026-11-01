<script lang="ts">
	// Element-changeable weapons: the weapon ID for each element. A blank ID
	// leaves the element out of the map
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import { ELEMENT_DISPLAY_ORDER, getElementImage, getElementLabel } from '$lib/utils/element'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'

	let { field, form }: InputProps = $props()

	const ids = $derived((form.values[field.key] ?? {}) as Record<string, string>)

	function update(key: string, id: string) {
		const rest = Object.fromEntries(Object.entries(ids).filter(([k]) => k !== key))
		form.set(field.key, id ? { ...rest, [key]: id } : rest)
	}
</script>

{#each ELEMENT_DISPLAY_ORDER as element (element)}
	{@const key = String(element)}
	<DetailItem label={getElementLabel(element)} editable error={form.errors[`${field.key}.${key}`]}>
		<div class="variant-id-input">
			<img class="element-icon" src={getElementImage(element)} alt={getElementLabel(element)} />
			<input
				class="variant-input contained"
				type="text"
				placeholder="Variant ID"
				value={ids[key] ?? ''}
				oninput={(e) => update(key, e.currentTarget.value)}
			/>
		</div>
	</DetailItem>
{/each}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.variant-id-input {
		display: flex;
		align-items: center;
		gap: spacing.$unit;

		.element-icon {
			width: 24px;
			height: 24px;
			flex-shrink: 0;
		}

		.variant-input {
			flex: 1;
			background-color: var(--input-bound-bg);
			border: none;
			border-radius: layout.$input-corner;
			color: var(--text-primary);
			font-size: typography.$font-regular;
			font-family: var(--font-family);
			padding: spacing.$unit calc(spacing.$unit * 1.5);
			min-height: spacing.$unit-4x;
			outline: none;
			transition: background-color 0.15s;

			&::placeholder {
				color: var(--text-tertiary);
			}

			&:hover {
				background-color: var(--input-bound-bg-hover);
			}
		}
	}
</style>
