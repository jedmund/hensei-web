<script lang="ts">
	// The weapon's awakenings: add from the weapon awakenings, remove from the list
	import { createQuery } from '@tanstack/svelte-query'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import Select from '$lib/components/ui/Select.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import { getAwakeningImage } from '$lib/utils/modifiers'
	import type { InputProps } from '$lib/features/database/schema/inputs/types'
	import type { Awakening } from '$lib/types/api/entities'

	let { field, form }: InputProps = $props()

	const allAwakeningsQuery = createQuery(() => entityQueries.awakenings('Weapon'))
	const allAwakenings = $derived(allAwakeningsQuery.data ?? [])

	const ids = $derived((form.values[field.key] ?? []) as string[])

	const awakenings = $derived(
		allAwakenings
			.filter((a: Awakening) => ids.includes(a.id))
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
	)

	// Awakenings not yet added, for the dropdown
	const availableOptions = $derived(
		allAwakenings
			.filter((a) => !ids.includes(a.id))
			.map((a) => ({ value: a.id, label: a.name?.en ?? a.slug }))
	)

	function add(id: string | undefined) {
		if (id) form.set(field.key, [...ids, id])
	}

	function remove(id: string) {
		form.set(
			field.key,
			ids.filter((aid) => aid !== id)
		)
	}
</script>

{#if availableOptions.length > 0}
	<Select
		options={availableOptions}
		placeholder="Add awakening..."
		onValueChange={add}
		contained
		fullWidth
	/>
{/if}
{#if awakenings.length > 0}
	<div class="awakening-list">
		{#each awakenings as awakening (awakening.id)}
			{@const imageUrl = getAwakeningImage({ type: awakening })}
			<div class="awakening-item">
				{#if imageUrl}
					<img src={imageUrl} alt={awakening.name?.en ?? awakening.slug} class="awakening-icon" />
				{:else}
					<div class="awakening-icon placeholder"></div>
				{/if}
				<span class="awakening-name">{awakening.name?.en ?? awakening.slug}</span>
				<button type="button" class="remove-button" onclick={() => remove(awakening.id)}>
					<Icon name="close" size={14} />
				</button>
			</div>
		{/each}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.awakening-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.awakening-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--background);
		border-radius: layout.$item-corner-small;
	}

	.awakening-icon {
		width: spacing.$unit-4x;
		height: spacing.$unit-4x;
		border-radius: layout.$item-corner-small;
		flex-shrink: 0;

		&.placeholder {
			background: var(--separator-bg);
		}
	}

	.awakening-name {
		font-size: typography.$font-regular;
		color: var(--text-primary);
		font-weight: typography.$medium;
	}

	.remove-button {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-secondary);
		padding: spacing.$unit-half;
		border-radius: layout.$item-corner-small;
		margin-left: auto;

		&:hover {
			color: var(--text-primary);
			background: var(--separator-bg);
		}
	}
</style>
