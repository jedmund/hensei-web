import type { LocalizedName } from '$lib/types/api/entities'
import type { UnifiedSearchSeriesRef } from '$lib/api/adapters/search.adapter'

/** Every kind of thing that can be mentioned with `@` in a description / notes field. */
export type MentionType = 'character' | 'weapon' | 'summon' | 'skill'

/**
 * The object persisted in a mention node's `data-id` attribute (JSON round-tripped).
 *
 * It is a superset of the legacy entity payload and keeps the original `type` field,
 * so documents saved before skills existed parse with zero migration. Only `type`,
 * `granblue_id`, and `name` are guaranteed; `element`/`proficiency`/… are entity-only
 * and `skill` is skill-only.
 */
export interface MentionToken {
	type: MentionType
	granblue_id: string
	name: LocalizedName

	// entity-only (character / weapon / summon)
	element?: { id: number; slug: string }
	proficiency?: number | number[]
	season?: number | null
	series?: number[] | UnifiedSearchSeriesRef[] | null
	styleSwap?: boolean

	// skill-only
	skill?: {
		description: LocalizedName
		gameIcon?: string | null
		typeColor?: string | null
		/** The slot kind this skill came from: 'ability' | 'ougi' | 'support'. */
		slotKind?: string
		/** 1-based slot position; players refer to active skills by it ("Octavia 2"). */
		slotPosition?: number
		/** Turns between uses; null for passives/supports. */
		cooldown?: number | null
		/** Turns until the skill is first usable (initial cooldown); 0/null when usable immediately. */
		initialCooldown?: number | null
		/** The party character the skill belongs to (for attribution + tooltip). */
		character?: { granblue_id: string; name: LocalizedName }
	}
}

/**
 * A single row in the `@`-mention dropdown. Presentation is precomputed here so the
 * list component stays dumb (no per-type branching for images/labels/links).
 */
export interface MentionSuggestion {
	/** Stable identity for `{#each}` keys and cross-provider de-duplication. */
	key: string
	/** Exactly what gets committed to the document when this row is selected. */
	token: MentionToken
	/** Thumbnail URL, or null to render a colored swatch instead. */
	imageUrl: string | null
	/** Swatch background used when `imageUrl` is null (skills without a game icon). */
	swatchColor?: string | null
	/** EN-first display label. */
	primaryLabel: string
	/** Element accent slug for the row styling. */
	elementSlug: string
}
