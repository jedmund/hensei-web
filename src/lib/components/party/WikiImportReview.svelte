<script lang="ts">
	/**
	 * What a gbf.wiki import will bring in: the items that matched as a row of
	 * square icons, which titles didn't (by slot), and what the page has that
	 * can't be imported.
	 */
	import { SvelteSet } from 'svelte/reactivity'
	import Notice from '$lib/components/ui/Notice.svelte'
	import * as m from '$lib/paraglide/messages'
	import type {
		WikiImportMatch,
		WikiImportReport,
		WikiImportRequest
	} from '$lib/types/api/wikiImport'
	import {
		getCharacterImage,
		getSummonImage,
		getWeaponFallbackImage,
		getWeaponImage
	} from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import type { WikiImportNote } from '$lib/utils/wikiImport'
	import { noteText, slotLabel, sortWarnings, warningText } from '$lib/utils/wikiImportMessages'

	interface Props {
		report: WikiImportReport
		notes: WikiImportNote[]
		/** What was sent, for names the warnings refer to (the class, awakenings) */
		request: WikiImportRequest | null
	}

	let { report, notes, request }: Props = $props()

	const KIND_ORDER = ['character', 'weapon', 'summon'] as const

	// Characters, then weapons (mainhand first), then summons, each in slot order
	const items = $derived(
		report.matched
			.filter((match) => (KIND_ORDER as readonly string[]).includes(match.kind))
			.toSorted(
				(a, b) =>
					KIND_ORDER.indexOf(a.kind as (typeof KIND_ORDER)[number]) -
						KIND_ORDER.indexOf(b.kind as (typeof KIND_ORDER)[number]) || a.position - b.position
			)
	)

	function squareImage({ kind, item }: WikiImportMatch): string {
		if (kind === 'character') return getCharacterImage(item.granblueId, 'square', '01')
		if (kind === 'weapon')
			return getWeaponImage(item.granblueId, 'square', item.element ?? undefined)
		return getSummonImage(item.granblueId, 'square')
	}

	// Items whose square art couldn't load, drawn as placeholders instead
	const missing = new SvelteSet<string>()
	const key = (match: WikiImportMatch) => `${match.kind}:${match.position}`

	// An element-changed weapon without its own square art falls back to the base
	// image; anything still missing becomes a placeholder
	function fallBack(event: Event, match: WikiImportMatch) {
		const img = event.currentTarget as HTMLImageElement
		const fallback =
			match.kind === 'weapon' ? getWeaponFallbackImage(match.item.granblueId, 'square') : undefined
		if (fallback && img.src !== new URL(fallback, img.baseURI).href) {
			img.src = fallback
			return
		}
		missing.add(key(match))
	}

	const total = $derived(report.matched.length + report.unmatched.length + report.ambiguous.length)
	const skipped = $derived([
		...notes.map(noteText),
		...sortWarnings(report.warnings).map((w) => warningText(w, request))
	])
</script>

<div class="review" aria-live="polite">
	<Notice variant={report.matched.length === total ? 'blue' : 'gray'}>
		<ul
			class="found"
			aria-label={m.party_import_wiki_matched({ matched: report.matched.length, total })}
		>
			{#each items as match (key(match))}
				{@const name = localizedName(match.item.name)}
				<li title={name}>
					{#if missing.has(key(match))}
						<span class="placeholder" role="img" aria-label={name}></span>
					{:else}
						<img
							src={squareImage(match)}
							alt={name}
							loading="lazy"
							onerror={(e) => fallBack(e, match)}
						/>
					{/if}
				</li>
			{/each}
		</ul>
	</Notice>

	{#if report.unmatched.length > 0}
		<section>
			<h4>{m.party_import_wiki_unmatched()}</h4>
			<ul>
				{#each report.unmatched as item (`${item.kind}:${item.position}`)}
					<li><span class="slot">{slotLabel(item.kind, item.position)}</span> {item.title}</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if report.ambiguous.length > 0}
		<section>
			<h4>{m.party_import_wiki_ambiguous()}</h4>
			<ul>
				{#each report.ambiguous as item (`${item.kind}:${item.position}`)}
					<li><span class="slot">{slotLabel(item.kind, item.position)}</span> {item.title}</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if skipped.length > 0}
		<section>
			<h4>{m.party_import_wiki_skipped()}</h4>
			<ul>
				{#each skipped as line, i (i)}
					<li>{line}</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.review {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		font-size: $font-small;
	}

	h4 {
		margin: 0 0 $unit-half;
		font-size: $font-small;
		font-weight: $medium;
	}

	ul {
		margin: 0;
		padding-left: $unit-3x;
		list-style: disc;
	}

	.found {
		display: flex;
		flex-wrap: wrap;
		gap: $unit-half;
		padding: 0;
		list-style: none;

		img,
		.placeholder {
			display: block;
			width: 60px;
			height: 60px;
			border-radius: $item-corner-small;
		}

		img {
			object-fit: cover;
		}

		.placeholder {
			background: var(--placeholder-bg);
		}
	}

	.slot {
		color: var(--text-secondary);
	}
</style>
