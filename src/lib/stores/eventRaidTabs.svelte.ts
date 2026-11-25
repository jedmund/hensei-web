/**
 * The raid tab each reader last picked on a home event card, by event id,
 * kept in this browser. A pick takes precedence over the card's default
 * (see defaultEventRaid). Storage can be missing or blocked; the card then
 * keeps its default.
 */

const STORAGE_KEY = 'home-event-raid-tabs'
// Only recent events matter; the oldest picks are dropped past this
const MAX_EVENTS = 20

type Picks = Record<string, string>

function load(): Picks {
	try {
		const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}
		return Object.fromEntries(
			Object.entries(parsed).filter(
				(entry): entry is [string, string] => typeof entry[1] === 'string'
			)
		)
	} catch {
		return {}
	}
}

class EventRaidTabs {
	// Loaded with the module in the browser, not on first read: reads happen
	// inside $derived, where state can't change
	#picks = $state<Picks>(typeof window === 'undefined' ? {} : load())

	/** The raid id last picked for this event, if any */
	get(eventId: string): string | undefined {
		return this.#picks[eventId]
	}

	/** Remembers a pick; call only from the reader's own tab changes */
	set(eventId: string, raidId: string) {
		// Re-inserted last, so the oldest picks are the first keys
		const rest = Object.entries(this.#picks).filter(([id]) => id !== eventId)
		const entries = [...rest, [eventId, raidId] as const].slice(-MAX_EVENTS)
		this.#picks = Object.fromEntries(entries)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#picks))
		} catch {
			// Storage blocked or full: the pick lasts for this page only
		}
	}
}

export const eventRaidTabs = new EventRaidTabs()
