<script lang="ts">
	/**
	 * What a gbf.wiki import will bring in: how many items matched, which
	 * titles didn't (by slot), and what the page has that can't be imported.
	 */
	import Notice from '$lib/components/ui/Notice.svelte'
	import * as m from '$lib/paraglide/messages'
	import type {
		WikiImportKind,
		WikiImportReport,
		WikiImportWarning
	} from '$lib/types/api/wikiImport'
	import type { WikiImportNote } from '$lib/utils/wikiImport'

	interface Props {
		report: WikiImportReport
		notes: WikiImportNote[]
	}

	let { report, notes }: Props = $props()

	function slotLabel(kind: WikiImportKind, position: number): string {
		const n = position + 1
		switch (kind) {
			case 'character':
				return m.party_import_wiki_slot_character({ n })
			case 'weapon':
				if (position === -1) return m.party_import_wiki_slot_mainhand()
				if (position >= 9) return m.party_import_wiki_slot_extra_weapon({ n: position - 8 })
				return m.party_import_wiki_slot_weapon({ n })
			case 'summon':
				if (position === -1) return m.party_import_wiki_slot_main_summon()
				if (position === 6) return m.details_friend_summon()
				if (position >= 4) return m.party_import_wiki_slot_sub_summon({ n: position - 3 })
				return m.party_import_wiki_slot_summon({ n })
			case 'job':
				return m.party_import_wiki_slot_class()
			case 'accessory':
				return m.party_import_wiki_slot_accessory()
			case 'skill':
				// Subskills are reported 1-3
				return m.party_import_wiki_slot_subskill({ n: position })
			case 'bullet':
				return m.sync_diff_bullet({ index: n })
			case 'key':
				return m.details_weapon_key_fallback()
		}
	}

	function noteText(note: WikiImportNote): string {
		const param = note.param ?? ''
		const value = note.value ?? ''
		switch (note.code) {
			case 'old_format':
				return m.party_import_wiki_note_old_format()
			case 'multiple_grids':
				return m.party_import_wiki_note_multiple_grids()
			case 'multiple_teams':
				return m.party_import_wiki_note_multiple_teams()
			case 'primal_bullet':
				return m.party_import_wiki_note_primal_bullet()
			case 'unknown_bullet':
				return m.party_import_wiki_note_unknown_bullet({ value })
			case 'unknown_key':
				return m.party_import_wiki_note_unknown_key({ value, param })
			case 'unknown_awakening':
				return m.party_import_wiki_note_unknown_awakening({ value, param })
			case 'unknown_uncap':
				return m.party_import_wiki_note_unknown_uncap({ value, param })
			case 'unreadable_value':
				return m.party_import_wiki_note_unreadable({ param })
			case 'too_many_bullets':
				return m.party_import_wiki_note_too_many_bullets()
		}
	}

	function warningText({ code, detail = '' }: WikiImportWarning): string {
		switch (code) {
			case 'unknown_job':
				return m.party_import_wiki_warning_job({ detail })
			case 'unknown_skill':
				return m.party_import_wiki_warning_skill({ detail })
			case 'unknown_accessory':
				return m.party_import_wiki_warning_accessory({ detail })
			case 'unknown_key':
				return m.party_import_wiki_warning_key({ detail })
			case 'unknown_bullet':
				return m.party_import_wiki_warning_bullet({ detail })
			case 'slot_conflict':
				return m.party_import_wiki_warning_slot_conflict({ detail })
			default:
				return m.party_import_wiki_warning_other({ detail: detail || code })
		}
	}

	const total = $derived(report.matched.length + report.unmatched.length + report.ambiguous.length)
	const skipped = $derived([...notes.map(noteText), ...report.warnings.map(warningText)])
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
