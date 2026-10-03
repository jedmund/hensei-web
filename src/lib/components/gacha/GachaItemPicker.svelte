<!-- GachaItemPicker - Searchable picker over an already-loaded gacha catalogue -->

<script lang="ts">
	import { tick } from 'svelte'
	import { Combobox } from 'bits-ui'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import {
		gachaItemKind,
		gachaItemName,
		gachaItemThumbnail,
		type GachaItemKind
	} from '$lib/utils/gacha'
	import type { CatalogueItem } from '$lib/types/gacha'

	interface Props {
		items: CatalogueItem[]
		value?: string
		label?: string
		placeholder?: string
		disabled?: boolean
		contained?: boolean
		error?: string
		/** Clear the field after each pick instead of keeping the selection */
		clearOnSelect?: boolean
		onValueChange?: (identity: string) => void
	}

	let {
		items,
		value = $bindable(''),
		label,
		placeholder = '',
		disabled = false,
		contained = false,
		error,
		clearOnSelect = false,
		onValueChange
	}: Props = $props()

	const id = $props.id()
	let open = $state(false)
	let query = $state('')

	const name = (item: CatalogueItem) => gachaItemName(item, getLocale())
	const selected = $derived(items.find((item) => item.identity === value))
	let inputValue = $derived(selected ? name(selected) : '')

	const groups = $derived.by(() => {
		const q = query.trim().toLowerCase()
		const matches = q
			? items.filter((item) =>
					[item.name.en, item.name.ja, item.granblue_id, item.recruits?.en, item.recruits?.ja].some(
						(text) => text?.toLowerCase().includes(q)
					)
				)
			: items
		const headings: Record<GachaItemKind, string> = {
			character: m.collection_tab_characters(),
			weapon: m.collection_tab_weapons(),
			summon: m.collection_tab_summons()
		}
		return (['character', 'weapon', 'summon'] as const)
			.map((kind) => ({
				kind,
				heading: headings[kind],
				items: matches
					.filter((item) => gachaItemKind(item) === kind)
					.sort((a, b) => b.rarity - a.rarity || name(a).localeCompare(name(b)))
					.slice(0, 30)
			}))
			.filter((group) => group.items.length > 0)
	})

	function handleInput(text: string) {
		query = text
		inputValue = text
		open = true
		if (!text) value = ''
	}

	async function handleValueChange(identity: string) {
		query = ''
		onValueChange?.(identity)
		if (clearOnSelect) {
			// Combobox writes the picked label into the input after this
			// handler runs, so clear it on the next tick
			await tick()
			value = ''
			inputValue = ''
		}
	}
</script>

<div class="picker" class:disabled class:contained>
	{#if label}
		<label class="label" for={id}>{label}</label>
	{/if}
	<Combobox.Root
		type="single"
		bind:value
		onValueChange={handleValueChange}
		bind:open
		{inputValue}
		{disabled}
		allowDeselect={false}
	>
		<Combobox.Input
			{id}
			class="picker-input"
			{placeholder}
			aria-invalid={error ? true : undefined}
			aria-describedby={error ? `${id}-error` : undefined}
			oninput={(e) => handleInput(e.currentTarget.value)}
			onfocus={() => (open = true)}
			onclick={() => (open = true)}
		/>
		<Combobox.Content class="picker-content">
			<Combobox.Viewport>
				{#each groups as group (group.kind)}
					<Combobox.Group class="picker-group">
						<Combobox.GroupHeading class="picker-heading">{group.heading}</Combobox.GroupHeading>
						{#each group.items as item (item.identity)}
							<Combobox.Item value={item.identity} label={name(item)} class="picker-item">
								{#snippet children({ selected })}
									<img src={gachaItemThumbnail(item)} alt="" class="item-image" />
									<span class="item-label">
										{name(item)}
										{#if group.kind === 'character'}
											<span class="item-detail"
												>{(getLocale() === 'ja' && item.name.ja) || item.name.en}</span
											>
										{/if}
									</span>
									{#if selected}
										<span class="item-check">
											<Icon name="check" size={14} />
										</span>
									{/if}
								{/snippet}
							</Combobox.Item>
						{/each}
					</Combobox.Group>
				{/each}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Root>
	{#if error}
		<span class="error" id="{id}-error">{error}</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/mixins' as *;
	@use '$src/themes/effects' as *;

	.picker {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		min-width: 0;

		&.disabled {
			opacity: 0.5;
			pointer-events: none;
		}
	}

	// Matches the Input component's error text
	.error {
		color: $error;
		font-size: $font-small;
		padding: $unit-half $unit-2x;
	}

	.label {
		color: var(--text-primary);
		font-size: $font-small;
		font-weight: $medium;
		margin-bottom: $unit-half;
	}

	:global(.picker .picker-input) {
		all: unset;
		box-sizing: border-box;
		-webkit-font-smoothing: antialiased;
		background-color: var(--input-bg);
		border-radius: $input-corner;
		// Matches Input: 2px reserved for the focus border
		border: 2px solid transparent;
		color: var(--text-primary);
		display: block;
		font-family: var(--font-family);
		font-size: $font-regular;
		min-height: $unit-4x;
		padding: $unit calc($unit * 1.5);
		width: 100%;
		@include smooth-transition($duration-quick, background-color, border-color);

		&::placeholder {
			color: var(--text-tertiary);
			opacity: 1;
		}

		&:hover {
			background-color: var(--input-bg-hover);
		}

		&:focus {
			border-color: $blue;
		}
	}

	.picker.contained :global(.picker-input) {
		background-color: var(--input-bound-bg);

		&:hover {
			background-color: var(--input-bound-bg-hover);
		}
	}

	:global(.picker-content) {
		background: var(--dialog-bg);
		border-radius: $card-corner;
		border: 1px solid rgba(0, 0, 0, 0.1);
		box-shadow: var(--shadow-lg);
		padding: $unit-half;
		min-width: var(--bits-combobox-anchor-width);
		max-height: 40vh;
		overflow: auto;
		z-index: $z-modal + 2;
		animation: fadeIn $duration-opacity-fade ease-out;
	}

	:global(.picker-item) {
		align-items: center;
		border-radius: $item-corner-small;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		gap: $unit;
		padding: $unit $unit-2x;
		user-select: none;
		@include smooth-transition($duration-quick, background-color);
	}

	:global(.picker-item:hover),
	:global(.picker-item[data-highlighted]) {
		background-color: var(--option-bg-hover);
	}

	:global(.picker-item[data-selected]) {
		font-weight: $medium;
	}

	:global(.picker-heading) {
		color: var(--text-secondary);
		font-size: $font-tiny;
		font-weight: $medium;
		padding: $unit $unit-2x $unit-half;
	}

	.item-detail {
		color: var(--text-tertiary);
		font-size: $font-small;
		margin-left: $unit-half;
	}

	.item-image {
		width: 32px;
		height: 32px;
		border-radius: $item-corner-small;
		flex-shrink: 0;
		object-fit: cover;
	}

	.item-label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.item-check {
		margin-left: auto;
		color: var(--accent-color);
	}
</style>
