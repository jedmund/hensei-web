<script lang="ts">
	import ChangelogUnit from './ChangelogUnit.svelte'
	import * as m from '$lib/paraglide/messages'

	interface UpdateItems {
		characters?: string[]
		weapons?: string[]
		summons?: string[]
	}

	interface Props {
		version: string
		date: string
		event: string
		new?: UpdateItems
		uncapped?: UpdateItems
		transcended?: UpdateItems
		awakened?: string[]
		raids?: string[]
		notes?: string[]
	}

	let {
		version,
		date,
		event,
		new: newItems,
		uncapped: uncappedItems,
		transcended: transcendedItems,
		awakened: awakenedItems,
		raids: raidItems,
		notes
	}: Props = $props()

	const eventLabels: Record<string, () => string> = {
		legfest: m.updates_event_legfest,
		flash: m.updates_event_flash,
		content: m.updates_event_content,
		uncap: m.updates_event_uncap
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
</script>

<section class="content-update" data-version={version}>
	<div class="header">
		<h3>{headerText}</h3>
		<time>{date}</time>
	</div>
	<div class="contents">
		{#each ['characters', 'weapons', 'summons'] as type (type)}
			{#if newItems?.[type as ItemType]?.length}
				<section class="item-section">
					<h4>
						{type === 'characters' ? m.updates_label_characters() : type === 'weapons' ? m.updates_label_weapons() : m.updates_label_summons()}
					</h4>
					<div class="items">
						{#each newItems[type as ItemType] ?? [] as id (id)}
							<ChangelogUnit {id} type={itemType(type as ItemType)} />
						{/each}
					</div>
				</section>
			{/if}
			{#if uncappedItems?.[type as ItemType]?.length}
				<section class="item-section">
					<h4>
						{type === 'characters' ? m.updates_label_uncap_characters() : type === 'weapons' ? m.updates_label_uncap_weapons() : m.updates_label_uncap_summons()}
					</h4>
					<div class="items">
						{#each uncappedItems[type as ItemType] ?? [] as id (id)}
							<ChangelogUnit {id} type={itemType(type as ItemType)} image={getUncapImage(type as ItemType)} />
						{/each}
					</div>
				</section>
			{/if}
			{#if transcendedItems?.[type as ItemType]?.length}
				<section class="item-section">
					<h4>
						{type === 'characters' ? m.updates_label_transcend_characters() : type === 'weapons' ? m.updates_label_transcend_weapons() : m.updates_label_transcend_summons()}
					</h4>
					<div class="items">
						{#each transcendedItems[type as ItemType] ?? [] as id (id)}
							<ChangelogUnit {id} type={itemType(type as ItemType)} image={getTranscendImage(type as ItemType)} />
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
						<ChangelogUnit {id} type="weapon" />
					{/each}
				</div>
			</section>
		{/if}
		{#if raidItems?.length}
			<section class="item-section">
				<h4>{m.updates_label_raids()}</h4>
				<div class="items">
					{#each raidItems as id (id)}
						<ChangelogUnit {id} type="raid" />
					{/each}
				</div>
			</section>
		{/if}
	</div>
	{#if notes?.length}
		<div class="notes">
			<section>
				<h4>{m.updates_label_other()}</h4>
				<ul class="list">
					{#each notes as note, i (i)}
						<li>{note}</li>
					{/each}
				</ul>
			</section>
		</div>
	{/if}
</section>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.content-update {
		display: flex;
		flex-direction: column;
		gap: $unit-4x;

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

		.notes {
			section {
				display: flex;
				flex-direction: column;
				gap: $unit;
			}

			h4 {
				font-weight: $medium;
				font-size: $font-regular;
			}

			.list {
				display: flex;
				flex-direction: column;
				color: var(--text-primary);
				list-style-type: disc;
				list-style-position: outside;
				padding-left: $unit-2x;
				gap: $unit-half;

				li {
					font-size: $font-regular;
				}
			}
		}
	}
</style>
