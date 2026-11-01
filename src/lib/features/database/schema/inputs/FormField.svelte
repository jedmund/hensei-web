<script lang="ts">
	// One field's input (two for a localized pair), drawn by its kind with
	// DetailItem's editable modes. Every change goes through `form.set`, so
	// derived values follow.
	import * as m from '$lib/paraglide/messages'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import TagInput from '$lib/components/ui/TagInput.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import ElementPicker from '$lib/components/ui/element-picker/ElementPicker.svelte'
	import { INPUT_COMPONENTS } from '../inputComponents'
	import NumberListInput from './NumberListInput.svelte'
	import OrderedEnumListInput from './OrderedEnumListInput.svelte'
	import ReferenceInput from './ReferenceInput.svelte'
	import ReferenceListInput from './ReferenceListInput.svelte'
	import { optionsFor } from './options'
	import type { InputProps } from './types'

	let props: InputProps = $props()
	const { field, form, element } = $derived(props)

	const key = $derived(field.key)
	const value = $derived(form.values[field.key])
	const label = $derived(field.label())
	const sublabel = $derived(field.sublabel?.())
	const error = $derived(form.error(field.key))
	const formOptions = $derived(field.form || {})
	const placeholder = $derived(formOptions.placeholder?.())
	const width = $derived(formOptions.width)
	const options = $derived(optionsFor(field))
	const Custom = $derived(field.render?.input ? INPUT_COMPONENTS[field.render.input] : null)

	const text = $derived((value ?? '') as string)
	const set = (v: unknown) => form.set(key, v)
	/** Blank inputs hold null: number inputs and the select's None */
	const setOrNull = (v: unknown) => form.set(key, v === '' || v === undefined ? null : v)
</script>

{#if Custom}
	<Custom {...props} />
{:else if field.kind === 'localized'}
	{@const pair = (value ?? {}) as Record<'en' | 'ja', unknown>}
	{#each ['en', 'ja'] as const as lang (lang)}
		{@const setSide = (v: unknown) => form.set(key, { ...pair, [lang]: v ?? '' })}
		{#if field.of === 'tags'}
			<DetailItem label={field.labels[lang]()} error={form.errors[`${key}.${lang}`]} editable>
				<TagInput
					bind:value={() => (pair[lang] ?? []) as string[], setSide}
					placeholder={m.db_field_add_tag()}
					contained
				/>
			</DetailItem>
		{:else}
			<DetailItem
				label={field.labels[lang]()}
				error={form.errors[`${key}.${lang}`]}
				editable
				type="text"
				bind:value={() => (pair[lang] ?? '') as string, setSide}
			/>
		{/if}
	{/each}
{:else if field.kind === 'text' || field.kind === 'code'}
	<DetailItem
		{label}
		{sublabel}
		{error}
		{placeholder}
		{width}
		editable
		type="text"
		bind:value={() => text, set}
	/>
{:else if field.kind === 'link'}
	<DetailItem
		{label}
		{sublabel}
		{error}
		{placeholder}
		{width}
		editable
		type="text"
		hasLinkButton
		linkUrl={field.href(text, form.values)}
		bind:value={() => text, set}
	/>
{:else if field.kind === 'number'}
	<DetailItem
		{label}
		{sublabel}
		{error}
		{placeholder}
		{width}
		editable
		type="number"
		min={field.min}
		max={field.max}
		bind:value={() => value as number | null, setOrNull}
	/>
{:else if field.kind === 'boolean'}
	<DetailItem
		{label}
		{sublabel}
		{error}
		{element}
		editable
		type="checkbox"
		bind:value={() => value === true, set}
	/>
{:else if field.kind === 'date'}
	<DetailItem
		{label}
		{sublabel}
		{error}
		{placeholder}
		editable
		type="date"
		bind:value={() => text, set}
	/>
{:else if field.kind === 'datetime'}
	<!-- A local date and time (YYYY-MM-DDTHH:mm); the definition converts its zone -->
	<DetailItem {label} {sublabel} {error} editable>
		<Input type="datetime-local" bind:value={() => text, set} contained />
	</DetailItem>
{:else if field.kind === 'enum' && field.list?.type === 'element'}
	<DetailItem {label} {sublabel} {error} editable>
		<ElementPicker
			bind:value={() => value as number, set}
			includeAny={options.some((o) => o.value === 0)}
			mode="dropdown"
			contained
		/>
	</DetailItem>
{:else if field.kind === 'enum'}
	<DetailItem
		{label}
		{sublabel}
		{error}
		{placeholder}
		editable
		type="select"
		options={field.required ? options : [{ value: '', label: m.option_none() }, ...options]}
		bind:value={() => (value ?? '') as string | number, setOrNull}
	/>
{:else if field.kind === 'enumList' && field.ordered}
	<OrderedEnumListInput {...props} />
{:else if field.kind === 'enumList'}
	<DetailItem {label} {sublabel} {error} editable>
		<MultiSelect
			size="medium"
			{options}
			bind:value={() => (value ?? []) as Array<string | number>, set}
			placeholder={placeholder ?? m.db_field_select()}
			contained
		/>
	</DetailItem>
{:else if field.kind === 'tags'}
	<DetailItem {label} {sublabel} {error} editable>
		<TagInput
			bind:value={() => (value ?? []) as string[], set}
			placeholder={placeholder ?? m.db_field_add_tag()}
			contained
		/>
	</DetailItem>
{:else if field.kind === 'numberList'}
	<NumberListInput {...props} />
{:else if field.kind === 'reference'}
	<ReferenceInput {...props} />
{:else if field.kind === 'referenceList'}
	<ReferenceListInput {...props} />
{/if}
