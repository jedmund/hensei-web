import * as m from '$lib/paraglide/messages'
import type {
	WikiImportKind,
	WikiImportRequest,
	WikiImportWarning,
	WikiWeaponAwakening
} from '$lib/types/api/wikiImport'
import type { WikiImportNote } from '$lib/utils/wikiImport'

/**
 * The text of a gbf.wiki import's review: slot labels, the parser's notes and
 * the API's warnings, localized.
 */

/** A slot as the review names it, or null when the kind or position is unknown. */
export function slotLabel(kind: WikiImportKind | undefined, position: number | undefined) {
	if (kind === undefined || position === undefined) return null
	switch (kind) {
		case 'character':
			return position >= 0 && position <= 7
				? m.party_import_wiki_slot_character({ n: position + 1 })
				: null
		case 'weapon':
			if (position === -1) return m.party_import_wiki_slot_mainhand()
			return position >= 0 && position <= 11
				? m.party_import_wiki_slot_weapon({ n: position + 1 })
				: null
		case 'summon':
			if (position === -1) return m.party_import_wiki_slot_main_summon()
			if (position === 6) return m.party_import_wiki_slot_support_summon()
			if (position === 4 || position === 5)
				return m.party_import_wiki_slot_sub_summon({ n: position - 3 })
			return position >= 0 && position <= 3
				? m.party_import_wiki_slot_summon({ n: position + 1 })
				: null
		case 'job':
			return m.party_import_wiki_slot_class()
		case 'accessory':
			return m.party_import_wiki_slot_accessory()
		case 'skill':
			// Subskills are reported 1-3
			return position >= 1 && position <= 3
				? m.party_import_wiki_slot_subskill({ n: position })
				: null
		case 'bullet':
			return m.sync_diff_bullet({ index: position + 1 })
		case 'key':
			return m.details_weapon_key_fallback()
		default:
			return null
	}
}

/** What the parser couldn't read from the page. */
export function noteText(note: WikiImportNote): string {
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

const AWAKENING_NAMES: Record<WikiWeaponAwakening, () => string> = {
	attack: m.party_import_wiki_awakening_attack,
	defense: m.party_import_wiki_awakening_defense,
	special: m.party_import_wiki_awakening_special,
	ca: m.party_import_wiki_awakening_ca,
	skill: m.party_import_wiki_awakening_skill,
	heal: m.party_import_wiki_awakening_heal,
	multiattack: m.party_import_wiki_awakening_multiattack
}

/** The awakening the request asked for at a warning's slot. */
function requestedAwakening(
	request: WikiImportRequest | null,
	{ kind, position }: WikiImportWarning
): string | null {
	const items =
		kind === 'weapon' ? request?.weapons : kind === 'character' ? request?.characters : undefined
	const awakening = items?.find((item) => item.position === position)?.awakening
	return awakening ? AWAKENING_NAMES[awakening]() : null
}

/** The warning's own text, without its slot. */
function warningBody(warning: WikiImportWarning, request: WikiImportRequest | null): string {
	const { code } = warning
	const title = warning.title || warning.detail || ''
	const job = request?.job.name
	switch (code) {
		case 'unknown_job':
			return m.party_import_wiki_warning_job({ title })
		case 'unknown_skill':
			return m.party_import_wiki_warning_skill({ title })
		case 'unknown_accessory':
			return m.party_import_wiki_warning_accessory({ title })
		case 'unknown_key':
			return m.party_import_wiki_warning_key({ title })
		case 'unknown_bullet':
			return m.party_import_wiki_warning_bullet({ title })
		case 'unknown_awakening':
			return m.party_import_wiki_warning_unknown_awakening({ title })
		case 'skill_not_allowed':
			return job
				? m.party_import_wiki_warning_skill_not_allowed({ title, job })
				: m.party_import_wiki_warning_skill_not_allowed_any({ title })
		case 'accessory_not_allowed':
			return job
				? m.party_import_wiki_warning_accessory_not_allowed({ title, job })
				: m.party_import_wiki_warning_accessory_not_allowed_any({ title })
		case 'awakening_not_allowed': {
			const awakening = requestedAwakening(request, warning)
			return awakening
				? m.party_import_wiki_warning_awakening_not_allowed({ title, awakening })
				: m.party_import_wiki_warning_awakening_not_allowed_any({ title })
		}
		case 'invalid_item':
			return m.party_import_wiki_warning_invalid_item({ title })
		case 'uncap_clamped':
			return m.party_import_wiki_warning_uncap_clamped()
		case 'invalid_uncap':
			return m.party_import_wiki_warning_invalid_uncap()
		case 'element_not_changeable':
			return m.party_import_wiki_warning_element({ title })
		case 'invalid_position':
			return m.party_import_wiki_warning_position({ title })
		case 'slot_conflict':
			return m.party_import_wiki_warning_slot_conflict({ title })
		default:
			return m.party_import_wiki_warning_other({ title: title || code })
	}
}

/**
 * One line per API warning: the slot (when the warning names one), then
 * what happened. Warnings in the older shape, with only a detail, still read.
 */
export function warningText(warning: WikiImportWarning, request: WikiImportRequest | null): string {
	const body = warningBody(warning, request)
	// Class, subskill and manatura lines name the item, which is enough.
	const gridKind = ['character', 'weapon', 'summon'].includes(warning.kind ?? '')
	const slot = gridKind ? slotLabel(warning.kind, warning.position) : null
	return slot ? m.party_import_wiki_slot_line({ slot, text: body }) : body
}
