<!--
  Renders one cell of a DataTable column by type. The row link is rendered
  by DataTable around this content, so cells never navigate themselves.
-->
<script lang="ts" generics="T">
	import * as m from '$lib/paraglide/messages'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import { getCharacterImage } from '$lib/utils/images/characters'
	import { handleImageFallback } from '$lib/utils/images/core'
	import { getSummonImage } from '$lib/utils/images/summons'
	import { getWeaponFallbackImage, getWeaponImage } from '$lib/utils/images/weapons'
	import { formatDate, primaryName, secondaryName } from './format'
	import type { DataTableColumn, ImageSource } from './types'

	interface Props {
		column: DataTableColumn<T>
		row: T
	}

	const { column, row }: Props = $props()

	const value = $derived(column.value?.(row))

	function resolveImage(): ImageSource | null {
		if (column.type !== 'image') return null
		if (typeof column.image === 'function') return column.image(row) ?? null
		const record = row as Record<string, unknown>
		const id = record.granblueId as string | undefined
		if (!id) return null
		switch (column.image) {
			case 'weapon': {
				// Element-changeable weapons (element 0) need the neutral art, with a fallback
				const neutral = record.element === 0
				return {
					src: getWeaponImage(id, 'square', neutral ? 0 : undefined),
					fallback: neutral ? getWeaponFallbackImage(id, 'square') : undefined
				}
			}
			case 'character':
				return { src: getCharacterImage(id, 'square', record.styleSwap ? '01_style' : '01') }
			case 'summon':
				return { src: getSummonImage(id, 'square') }
		}
	}

	const image = $derived(resolveImage())
	const name = $derived(column.type === 'name' ? column.name(row) : null)
	const flags = $derived(column.type === 'flags' ? column.flags(row) : [])
	const isEmptyValue = $derived(value === null || value === undefined || value === '')
</script>

{#if column.type === 'custom'}
	{@render column.cell(row)}
{:else if column.type === 'image'}
	{#if image}
		<img
			class="thumb"
			src={image.src}
			alt={image.alt ?? ''}
			loading="lazy"
			onerror={(e) => handleImageFallback(e, image.fallback)}
		/>
	{/if}
{:else if column.type === 'name'}
	<span class="name">
		<span class="primary">{primaryName(name) || '—'}</span>
		{#if secondaryName(name)}
			<span class="secondary" lang={secondaryName(name) === name?.ja ? 'ja' : 'en'}
				>{secondaryName(name)}</span
			>
		{/if}
	</span>
{:else if column.type === 'element'}
	{#if typeof value === 'number'}<ElementLabel element={value} size="small" />{/if}
{:else if column.type === 'proficiency'}
	{#if typeof value === 'number'}<ProficiencyLabel proficiency={value} size="small" />{/if}
{:else if column.type === 'flags'}
	{#if flags.length > 0}
		<span class="flags">
			{#each flags as flag (flag.label)}
				<span class="flag {flag.tone ?? 'neutral'}">{flag.label}</span>
			{/each}
		</span>
	{:else}
		<span class="empty">—</span>
	{/if}
{:else if column.type === 'boolean'}
	<span class:empty={!value}>{value ? m.data_table_yes() : m.data_table_no()}</span>
{:else if column.type === 'date'}
	{@const formatted = formatDate(value)}
	<span class:empty={!formatted}>{formatted || '—'}</span>
{:else if isEmptyValue}
	<span class="empty">—</span>
{:else if column.type === 'code'}
	<code>{String(value)}</code>
{:else if column.type === 'number'}
	<span class="number">{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
{:else}
	<span class="text">{String(value)}</span>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.thumb {
		display: block;
		height: calc(var(--dt-row-height) - #{spacing.$unit});
		width: auto;
		max-width: 100%;
		object-fit: contain;
		border-radius: layout.$item-corner-small;
	}

	.name {
		display: flex;
		flex-direction: column;
		min-width: 0;
		line-height: 1.25;
	}

	.primary,
	.secondary,
	.text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.secondary {
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.number {
		font-variant-numeric: tabular-nums;
	}

	.empty {
		color: var(--text-tertiary);
	}

	code {
		font-size: typography.$font-small;
		background: var(--bar-bg);
		padding: 2px 6px;
		border-radius: 3px;
	}

	.flags {
		display: flex;
		flex-wrap: nowrap;
		gap: spacing.$unit-half;
		overflow: hidden;
	}

	.flag {
		font-size: typography.$font-tiny;
		padding: 2px 6px;
		border-radius: layout.$item-corner-small;
		font-weight: typography.$medium;
		white-space: nowrap;
		background: var(--bar-bg);
		color: var(--text-secondary);

		&.extra {
			background: var(--badge-extra-bg);
			color: var(--badge-extra-text);
		}

		&.element {
			background: var(--badge-element-bg);
			color: var(--badge-element-text);
		}

		&.keys {
			background: var(--badge-keys-bg);
			color: var(--badge-keys-text);
		}

		&.awaken {
			background: var(--badge-awaken-bg);
			color: var(--badge-awaken-text);
		}

		&.ax {
			background: var(--badge-ax-bg);
			color: var(--badge-ax-text);
		}
	}
</style>
