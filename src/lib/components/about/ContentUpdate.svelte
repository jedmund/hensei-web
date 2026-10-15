<script lang="ts">
	import ChangelogUnit from './ChangelogUnit.svelte'
	import * as m from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import updateNames from '$lib/data/updateNames.json'

	interface UpdateItems {
		characters?: string[]
		styles?: string[]
		weapons?: string[]
		summons?: string[]
	}

	/** Changes to the site or the extension, sorted by kind */
	interface ProductChanges {
		new?: string[]
		improved?: string[]
		fixed?: string[]
	}

	type UpdateFilter = 'all' | 'game' | 'site' | 'extension'

	interface Props {
		version: string
		date: string
		event: string
		new?: UpdateItems
		uncapped?: UpdateItems
		transcended?: UpdateItems
		awakened?: string[]
		classes?: string[]
		manatura?: string[]
		shields?: string[]
		raids?: string[]
		/** Game-side notes (new classes, raids, data changes) */
		notes?: string[]
		site?: ProductChanges
		extension?: ProductChanges
		filter?: UpdateFilter
	}

	let {
		version,
		date,
		event,
		new: newItems,
		uncapped: uncappedItems,
		transcended: transcendedItems,
		awakened: awakenedItems,
		classes: classItems,
		manatura: manaturaItems,
		shields: shieldItems,
		raids: raidItems,
		notes,
		site,
		extension,
		filter = 'all'
	}: Props = $props()

	const showGame = $derived(filter === 'all' || filter === 'game')
	const showSite = $derived(filter === 'all' || filter === 'site')
	const showExtension = $derived(filter === 'all' || filter === 'extension')

	const hasItems = $derived(
		[newItems, uncappedItems, transcendedItems].some((items) =>
			Object.values(items ?? {}).some((ids) => ids?.length)
		) ||
			!!awakenedItems?.length ||
			!!classItems?.length ||
			!!manaturaItems?.length ||
			!!shieldItems?.length ||
			!!raidItems?.length
	)

	const eventLabels: Record<string, () => string> = {
		legfest: m.updates_event_legfest,
		flash: m.updates_event_flash,
		content: m.updates_event_content,
		uncap: m.updates_event_uncap,
		collab: m.updates_event_collab
	}

	const parsedDate = $derived(new Date(date))
	const month = $derived(`${parsedDate.getMonth() + 1}`.padStart(2, '0'))
	const year = $derived(parsedDate.getFullYear())
	const eventLabel = $derived(eventLabels[event]?.() ?? event)
	const headerText = $derived(`${month}/${year}  ${eventLabel}`)

	type ItemType = 'characters' | 'weapons' | 'summons'
	type ImageVariant = '01' | '02' | '03' | '04'

	function getUncapImage(type: ItemType): ImageVariant {
		return type === 'characters' ? '03' : '01'
	}

	function getTranscendImage(type: ItemType): ImageVariant {
		return type === 'characters' || type === 'summons' ? '04' : '03'
	}

	function itemType(plural: ItemType): 'character' | 'weapon' | 'summon' {
		return plural.slice(0, -1) as 'character' | 'weapon' | 'summon'
	}

	/** Splits a note into plain and **bold** parts, so names can be emphasised without rendering HTML */
	function segments(text: string): { text: string; bold: boolean }[] {
		return text
			.split(/\*\*(.+?)\*\*/)
			.map((part, i) => ({ text: part, bold: i % 2 === 1 }))
			.filter((part) => part.text)
	}

	type NameGroup = keyof typeof updateNames
	const names = updateNames as Record<NameGroup, Record<string, { en: string; ja: string }>>

	function itemName(group: NameGroup, id: string): string {
		const name = names[group][id]
		if (!name) return ''
		return getLocale() === 'ja' ? name.ja : name.en
	}
</script>

<section class="content-update" data-version={version}>
	<div class="header">
		<h3>{headerText}</h3>
		<time>{date}</time>
	</div>
	{#if showGame && hasItems}
		<div class="contents">
			{#if newItems?.styles?.length}
				<section class="item-section">
					<h4>{m.updates_label_styles()}</h4>
					<div class="items">
						{#each newItems.styles as id (id)}
							<ChangelogUnit {id} type="character" style name={itemName('styles', id)} />
						{/each}
					</div>
				</section>
			{/if}
			{#each ['characters', 'weapons', 'summons'] as type (type)}
				{#if newItems?.[type as ItemType]?.length}
					<section class="item-section">
						<h4>
							{type === 'characters'
								? m.updates_label_characters()
								: type === 'weapons'
									? m.updates_label_weapons()
									: m.updates_label_summons()}
						</h4>
						<div class="items">
							{#each newItems[type as ItemType] ?? [] as id (id)}
								<ChangelogUnit
									{id}
									type={itemType(type as ItemType)}
									name={itemName(type as ItemType, id)}
								/>
							{/each}
						</div>
					</section>
				{/if}
				{#if uncappedItems?.[type as ItemType]?.length}
					<section class="item-section">
						<h4>
							{type === 'characters'
								? m.updates_label_uncap_characters()
								: type === 'weapons'
									? m.updates_label_uncap_weapons()
									: m.updates_label_uncap_summons()}
						</h4>
						<div class="items">
							{#each uncappedItems[type as ItemType] ?? [] as id (id)}
								<ChangelogUnit
									{id}
									type={itemType(type as ItemType)}
									image={getUncapImage(type as ItemType)}
									name={itemName(type as ItemType, id)}
								/>
							{/each}
						</div>
					</section>
				{/if}
				{#if transcendedItems?.[type as ItemType]?.length}
					<section class="item-section">
						<h4>
							{type === 'characters'
								? m.updates_label_transcend_characters()
								: type === 'weapons'
									? m.updates_label_transcend_weapons()
									: m.updates_label_transcend_summons()}
						</h4>
						<div class="items">
							{#each transcendedItems[type as ItemType] ?? [] as id (id)}
								<ChangelogUnit
									{id}
									type={itemType(type as ItemType)}
									image={getTranscendImage(type as ItemType)}
									name={itemName(type as ItemType, id)}
								/>
							{/each}
						</div>
					</section>
				{/if}
			{/each}
			{#if awakenedItems?.length}
				<section class="item-section">
					<h4>{m.updates_label_awakened_weapons()}</h4>
					<div class="items">
						{#each awakenedItems as id (id)}
							<ChangelogUnit {id} type="weapon" name={itemName('weapons', id)} />
						{/each}
					</div>
				</section>
			{/if}
			{#if classItems?.length}
				<section class="item-section">
					<h4>{m.updates_label_classes()}</h4>
					<div class="items">
						{#each classItems as id (id)}
							<ChangelogUnit {id} type="class" name={itemName('classes', id)} />
						{/each}
					</div>
				</section>
			{/if}
			{#if manaturaItems?.length}
				<section class="item-section">
					<h4>{m.updates_label_manatura()}</h4>
					<div class="items">
						{#each manaturaItems as id (id)}
							<ChangelogUnit {id} type="accessory" name={itemName('manatura', id)} />
						{/each}
					</div>
				</section>
			{/if}
			{#if shieldItems?.length}
				<section class="item-section">
					<h4>{m.updates_label_shields()}</h4>
					<div class="items">
						{#each shieldItems as id (id)}
							<ChangelogUnit {id} type="accessory" name={itemName('shields', id)} />
						{/each}
					</div>
				</section>
			{/if}
			{#if raidItems?.length}
				<section class="item-section">
					<h4>{m.updates_label_raids()}</h4>
					<div class="items">
						{#each raidItems as id (id)}
							<ChangelogUnit {id} type="raid" name={itemName('raids', id)} />
						{/each}
					</div>
				</section>
			{/if}
		</div>
	{/if}
	{#if showGame && notes?.length}
		<section class="notes">
			<h4>{m.updates_label_other()}</h4>
			<ul class="list">
				{#each notes as note, i (i)}
					<li>{@render rich(note)}</li>
				{/each}
			</ul>
		</section>
	{/if}
	{#if showSite && site}
		{@render changes(m.updates_section_site(), site)}
	{/if}
	{#if showExtension && extension}
		{@render changes(m.updates_section_extension(), extension)}
	{/if}
</section>

{#snippet rich(text: string)}
	{#each segments(text) as part, i (i)}{#if part.bold}<strong>{part.text}</strong
			>{:else}{part.text}{/if}{/each}
{/snippet}

{#snippet changes(title: string, product: ProductChanges)}
	<section class="product">
		<h4>{title}</h4>
		{#if product.new?.length}
			<div class="kind">
				<h5>{m.updates_kind_new()}</h5>
				<ul class="list">
					{#each product.new as text, i (i)}
						<li>{@render rich(text)}</li>
					{/each}
				</ul>
			</div>
		{/if}
		{#if product.improved?.length}
			<div class="kind">
				<h5>{m.updates_kind_improved()}</h5>
				<ul class="list">
					{#each product.improved as text, i (i)}
						<li>{@render rich(text)}</li>
					{/each}
				</ul>
			</div>
		{/if}
		{#if product.fixed?.length}
			<div class="kind">
				<h5>{m.updates_kind_fixed()}</h5>
				<ul class="list">
					{#each product.fixed as text, i (i)}
						<li>{@render rich(text)}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</section>
{/snippet}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.content-update {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;
		color: var(--text-primary);

		.header {
			align-items: baseline;
			display: flex;
			gap: $unit-half;

			h3 {
				color: var(--accent-yellow);
				font-weight: $medium;
				font-size: $font-large;
			}

			time {
				color: var(--text-secondary);
				font-size: $font-small;
				font-weight: $medium;
			}
		}

		.contents {
			display: grid;
			grid-template-columns: 1fr;
			gap: $unit-4x;

			.item-section {
				display: grid;
				grid-template-rows: auto 1fr;
				gap: $unit;

				& > h4 {
					font-weight: $medium;
					font-size: $font-regular;
				}

				.items {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
					gap: $unit-4x;
				}
			}
		}

		.notes,
		.product {
			display: flex;
			flex-direction: column;
			gap: $unit;

			h4 {
				font-weight: $medium;
				font-size: $font-regular;
			}
		}

		.product {
			gap: $unit-2x;

			.kind {
				display: flex;
				flex-direction: column;
				gap: $unit-half;
			}

			h5 {
				margin: 0;
				color: var(--text-secondary);
				font-size: $font-small;
				font-weight: $medium;
			}
		}

		.notes,
		.product {
			.list {
				display: flex;
				flex-direction: column;
				color: var(--text-primary);
				list-style-type: disc;
				list-style-position: outside;
				margin: 0;
				padding-left: $unit-2x;
				gap: $unit-half;

				li {
					font-size: $font-regular;
				}

				strong {
					font-weight: $bold;
				}
			}
		}
	}
</style>
