import { goto } from '$app/navigation'
import { toast } from 'svelte-sonner'
import { localizeHref } from '$lib/paraglide/runtime'
import * as m from '$lib/paraglide/messages'
import type { Party } from '$lib/types/api/party'
import type { WikiImportReport, WikiImportRequest } from '$lib/types/api/wikiImport'
import { wikiImportAdapter } from '$lib/api/adapters/wikiImport.adapter'
import { useImportWikiParty } from '$lib/api/mutations/party.mutations'
import { storeEditKey } from '$lib/utils/editKeys'
import { getLocalId } from '$lib/utils/localId'
import {
	isEmptyWikiImport,
	parseTeamSpread,
	WikiImportParseError,
	type WikiImportNote
} from '$lib/utils/wikiImport'

interface WikiImportOptions {
	getParty: () => Party
	getAuthUserId: () => string | undefined
}

/** The error toast for a failed preview or create, by HTTP status. */
function failureMessage(err: unknown): string {
	const status = (err as { status?: number } | null)?.status
	if (status === 413) return m.party_import_wiki_too_large()
	if (status === 429) return m.party_import_wiki_rate_limited()
	return m.party_import_wiki_failed()
}

/**
 * Importing a gbf.wiki TeamSpread team from the new-team page: paste, parse,
 * preview what the API matches, then create it as a separate team and open it.
 */
export function useWikiImport(opts: WikiImportOptions) {
	const importParty = useImportWikiParty()

	let open = $state(false)
	let confirmOpen = $state(false)
	let text = $state('')
	let busy = $state(false)
	let request = $state<WikiImportRequest | null>(null)
	let notes = $state<WikiImportNote[]>([])
	let report = $state<WikiImportReport | null>(null)

	function hasItems(party: Party): boolean {
		return (
			party.characters.length > 0 ||
			party.weapons.length > 0 ||
			party.summons.length > 0 ||
			!!party.job
		)
	}

	function resetReview() {
		request = null
		notes = []
		report = null
	}

	function openDialog() {
		text = ''
		resetReview()
		open = true
	}

	/** From the menu. A team that already has items is left as is, so say so first. */
	function start() {
		if (hasItems(opts.getParty())) confirmOpen = true
		else openDialog()
	}

	function confirmStart() {
		confirmOpen = false
		// Let the confirm dialog close before the import dialog opens.
		setTimeout(openDialog)
	}

	async function preview() {
		let parsed
		try {
			parsed = parseTeamSpread(text)
		} catch (err) {
			if (err instanceof WikiImportParseError && err.code === 'too_large')
				toast.error(m.party_import_wiki_too_large())
			else toast.error(m.party_import_wiki_not_found())
			return
		}
		if (isEmptyWikiImport(parsed.request)) {
			toast.error(
				parsed.unsupported.some((n) => n.code === 'old_format')
					? m.party_import_wiki_note_old_format()
					: m.party_import_wiki_nothing()
			)
			return
		}

		busy = true
		try {
			const response = await wikiImportAdapter.preview(parsed.request)
			request = parsed.request
			notes = parsed.unsupported
			report = response.report
		} catch (err) {
			toast.error(failureMessage(err))
		} finally {
			busy = false
		}
	}

	async function create() {
		if (!request) return
		busy = true
		try {
			const { party, report: created } = await importParty.mutateAsync(
				// Anonymous teams are tied to this browser, like a normal new team
				opts.getAuthUserId() ? request : { ...request, localId: getLocalId() }
			)
			if (!party) throw new Error('No party in the import response')
			if (party.editKey) {
				storeEditKey(party.shortcode, party.editKey)
				storeEditKey(party.id, party.editKey)
			}
			open = false
			toast.success(m.party_import_wiki_success())
			// Some items only fail once the grid is built (series conflicts,
			// proficiency), which the preview can't know.
			if (created.warnings.length > 0)
				toast.warning(m.party_import_wiki_created_warnings({ count: created.warnings.length }))
			await goto(localizeHref(`/teams/${party.shortcode}`))
		} catch (err) {
			toast.error(failureMessage(err))
		} finally {
			busy = false
		}
	}

	return {
		get open() {
			return open
		},
		set open(v: boolean) {
			open = v
		},
		get confirmOpen() {
			return confirmOpen
		},
		set confirmOpen(v: boolean) {
			confirmOpen = v
		},
		get text() {
			return text
		},
		/** Editing the paste drops the review, so it can't go stale. */
		set text(v: string) {
			if (v !== text) resetReview()
			text = v
		},
		get busy() {
			return busy
		},
		get notes() {
			return notes
		},
		get report() {
			return report
		},
		start,
		confirmStart,
		/** Previews the paste, then creates the team once the review is showing. */
		submit() {
			return report ? create() : preview()
		}
	}
}

export type WikiImport = ReturnType<typeof useWikiImport>
