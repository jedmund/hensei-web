<script lang="ts">
	// An ordered enum list whose values may repeat (e.g. a gun's bullet slots):
	// one select per slot, up to the field's `max`
	import * as m from '$lib/paraglide/messages'
	import Select from '$lib/components/ui/Select.svelte'
	import { optionsFor } from './options'
	import type { InputProps } from './types'

	let { field, form }: InputProps = $props()

	const options = $derived(optionsFor(field))
	const list = $derived((form.values[field.key] ?? []) as Array<string | number>)
	const max = $derived(field.kind === 'enumList' ? field.max : undefined)

	function replace(index: number, value: string | number | undefined) {
		if (value === undefined) return
		form.set(
			field.key,
			list.map((v, i) => (i === index ? value : v))
		)
	}
</script>

<div class="slots">
	{#each list as value, i (i)}
		<div class="slot">
			<span class="index">{m.db_field_slot({ n: i + 1 })}</span>
			<Select {options} {value} onValueChange={(v) => replace(i, v)} size="small" contained />
			<button
				type="button"
				class="remove"
				aria-label={m.db_field_remove()}
				onclick={() =>
					form.set(
						field.key,
						list.filter((_, idx) => idx !== i)
					)}
			>
				&times;
			</button>
		</div>
	{/each}
	{#if options[0] && (max === undefined || list.length < max)}
		<button
			type="button"
			class="add"
			onclick={() => form.set(field.key, [...list, options[0]!.value])}
		>
			+ {m.db_field_add_slot()}
		</button>
	{/if}
	{#if form.error(field.key)}
		<span class="error" role="alert">{form.error(field.key)}</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.slots {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit spacing.$unit-2x;
	}

	.slot {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
	}

	.index {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		min-width: 48px;
	}

	.remove {
		background: none;
		border: none;
		color: var(--text-tertiary);
		font-size: typography.$font-large;
		cursor: pointer;
		padding: 0 spacing.$unit-half;
		line-height: 1;

		&:hover {
			color: var(--red);
		}
	}

	.add {
		background: none;
		border: 1px dashed var(--border-subtle);
		border-radius: layout.$item-corner;
		padding: spacing.$unit-half spacing.$unit;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--accent-blue);
		cursor: pointer;
		align-self: flex-start;

		&:hover {
			border-color: var(--accent-blue);
			background: color-mix(in srgb, var(--accent-blue) 10%, transparent);
		}
	}

	.error {
		font-size: typography.$font-small;
		color: colors.$error;
	}
</style>
