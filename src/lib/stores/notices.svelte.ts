/**
 * Dismissible in-app notices (feature tips), remembered per browser.
 *
 * Each notice runs a tiny state machine: it starts `active`, a `dismiss` event
 * moves it to `dismissed`, and `reset` brings it back. Only explicit
 * transitions in TRANSITIONS are allowed. Bumping a notice's version in
 * NOTICES re-shows it to everyone who dismissed an older version.
 */

export type NoticeState = 'active' | 'dismissed'
export type NoticeEvent = 'dismiss' | 'reset'

/** Every notice and its current content version. */
export const NOTICES = {
	'full-auto-skills': 1,
	'weapon-calculator': 1
} as const

export type NoticeId = keyof typeof NOTICES

const TRANSITIONS: Record<NoticeState, Partial<Record<NoticeEvent, NoticeState>>> = {
	active: { dismiss: 'dismissed' },
	dismissed: { reset: 'active' }
}

interface StoredNotice {
	state: NoticeState
	version: number
}

const STORAGE_KEY = 'notices'

export function transition(state: NoticeState, event: NoticeEvent): NoticeState {
	return TRANSITIONS[state][event] ?? state
}

function isStoredNotice(value: unknown): value is StoredNotice {
	if (typeof value !== 'object' || value === null) return false
	const { state, version } = value as Record<string, unknown>
	return (state === 'active' || state === 'dismissed') && typeof version === 'number'
}

function loadFromStorage(): Partial<Record<NoticeId, StoredNotice>> {
	if (typeof window === 'undefined') return {}

	try {
		const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
		if (typeof parsed !== 'object' || parsed === null) return {}

		const loaded: Partial<Record<NoticeId, StoredNotice>> = {}
		for (const id of Object.keys(NOTICES) as NoticeId[]) {
			const entry = (parsed as Record<string, unknown>)[id]
			if (isStoredNotice(entry)) loaded[id] = entry
		}
		return loaded
	} catch {
		// Blocked or corrupt storage: every notice stays active.
		return {}
	}
}

class NoticesStore {
	// Loaded once up front: reads happen inside templates, where writing state
	// isn't allowed, so state() must never be the thing that loads storage.
	#notices = $state<Partial<Record<NoticeId, StoredNotice>>>(loadFromStorage())

	#save() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#notices))
		} catch {
			// Storage unavailable; the state still holds for this session.
		}
	}

	/** Current state; a notice stored for an older version counts as active. */
	state(id: NoticeId): NoticeState {
		const stored = this.#notices[id]
		return stored && stored.version === NOTICES[id] ? stored.state : 'active'
	}

	isActive(id: NoticeId): boolean {
		return this.state(id) === 'active'
	}

	send(id: NoticeId, event: NoticeEvent) {
		const next = transition(this.state(id), event)
		this.#notices = { ...this.#notices, [id]: { state: next, version: NOTICES[id] } }
		this.#save()
	}

	dismiss(id: NoticeId) {
		this.send(id, 'dismiss')
	}

	reset(id: NoticeId) {
		this.send(id, 'reset')
	}
}

export const notices = new NoticesStore()
