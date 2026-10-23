<script lang="ts">
	/**
	 * What a gbf.wiki import will bring in: how many items matched, which
	 * titles didn't (by slot), and what the page has that can't be imported.
	 */
	import Notice from '$lib/components/ui/Notice.svelte'
	import * as m from '$lib/paraglide/messages'
	import type { WikiImportReport, WikiImportRequest } from '$lib/types/api/wikiImport'
	import type { WikiImportNote } from '$lib/utils/wikiImport'
	import { noteText, slotLabel, sortWarnings, warningText } from '$lib/utils/wikiImportMessages'

	interface Props {
		report: WikiImportReport
		notes: WikiImportNote[]
		/** What was sent, for names the warnings refer to (the class, awakenings) */
		request: WikiImportRequest | null
	}

	let { report, notes, request }: Props = $props()

	const total = $derived(report.matched.length + report.unmatched.length + report.ambiguous.length)
	const skipped = $derived([
		...notes.map(noteText),
		...sortWarnings(report.warnings).map((w) => warningText(w, request))
	])
</script>

<div class="review" aria-live="polite">
	<Notice variant={report.matched.length === total ? 'blue' : 'gray'}>
		<p>{m.party_import_wiki_matched({ matched: report.matched.length, total })}</p>
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

	.slot {
		color: var(--text-secondary);
	}

	p {
		margin: 0;
	}
</style>
