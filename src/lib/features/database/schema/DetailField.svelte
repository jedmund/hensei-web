<script lang="ts">
	// One field's row (two for a localized pair) in the detail's Info tab,
	// drawn by its kind. Plain values go through `detailText`.
	import * as m from '$lib/paraglide/messages'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import CopyableText from '$lib/components/ui/CopyableText.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import AssociatedEntityLink from '$lib/components/database/AssociatedEntityLink.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import { detailOptions, detailText, emptyText } from './detail'
	import { DETAIL_COMPONENTS } from './detailComponents'
	import type { Field, Values } from './types'

	type ElementName = 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light'

	interface Props {
		// The registry boundary is untyped
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		field: Field<any, any>
		value: unknown
		record: unknown
		/** Every field's value, for link URLs */
		values: Values
		/** Colours the link buttons */
		element?: ElementName
	}

	let { field, value, record, values, element }: Props = $props()

	const sublabel = $derived(
		detailOptions(field).sublabel === false ? undefined : field.sublabel?.()
	)
	const text = $derived(detailText(field, value))
	const empty = $derived(emptyText(field))
	const Custom = $derived(field.render?.detail ? DETAIL_COMPONENTS[field.render.detail] : null)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the reference's own shape
	const ref = $derived(value as any)
</script>

{#snippet chips(tags: unknown)}
	{#if Array.isArray(tags) && tags.length}
		<div class="tags">
			{#each tags as tag, i (i)}
				<span class="tag">{tag}</span>
			{/each}
		</div>
	{:else}
		<span class="empty-value">{empty}</span>
	{/if}
{/snippet}

{#if field.kind === 'localized'}
	{@const pair = value as Record<string, unknown> | null | undefined}
	{#each ['en', 'ja'] as const as lang (lang)}
		{#if field.of === 'tags'}
			<DetailItem label={field.labels[lang]()}>
				{@render chips(pair?.[lang])}
			</DetailItem>
		{:else}
			<DetailItem label={field.labels[lang]()} value={(pair?.[lang] as string) || empty} />
		{/if}
	{/each}
{:else if text !== null}
	<DetailItem label={field.label()} {sublabel} value={text} />
{:else}
	<DetailItem label={field.label()} {sublabel}>
		{#if Custom}
			<Custom {record} />
		{:else if field.kind === 'code'}
			<CopyableText value={String(value)} />
		{:else if field.kind === 'link'}
			<Button
				href={field.href(String(value), values) ?? undefined}
				target="_blank"
				variant="element-ghost"
				{element}
				size="small"
				rightIcon="link"
			>
				{m.db_detail_open()}
			</Button>
		{:else if field.kind === 'tags'}
			{@render chips(value)}
		{:else if field.kind === 'enum' && field.list?.type === 'element'}
			<ElementLabel element={value as number} size="medium" />
		{:else if field.kind === 'enum' && field.list?.type === 'proficiency'}
			<ProficiencyLabel proficiency={Array.isArray(value) ? value[0] : value} size="medium" />
		{:else if field.kind === 'reference' && field.resource === 'character'}
			<AssociatedEntityLink type="character" entity={ref}>
				<CharacterTags character={ref} />
			</AssociatedEntityLink>
		{/if}
	</DetailItem>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit;
	}

	.tag {
		background: var(--background);
		padding: spacing.$unit-half spacing.$unit;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
	}

	.empty-value {
		color: var(--text-secondary);
	}
</style>
