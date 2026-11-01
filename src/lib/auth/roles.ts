/**
 * Account roles, from `account.role`. Each role can do everything the ones
 * below it can.
 *
 * - Curators feature teams (staff picks) and can read Database > Events.
 * - Editors manage the whole Database.
 */

export const CURATOR_ROLE = 6
export const EDITOR_ROLE = 7
export const ADMIN_ROLE = 9

type Role = number | null | undefined

export function isCurator(role: Role): boolean {
	return (role ?? 0) >= CURATOR_ROLE
}

export function isEditor(role: Role): boolean {
	return (role ?? 0) >= EDITOR_ROLE
}

/**
 * The role a Database route needs, from its SvelteKit route id. Curators get
 * the Events pages (and the Database root, which sends them there); every
 * other Database route stays editor-only. Pages that write, like
 * `events/new`, still check for an editor themselves.
 */
export function requiredDatabaseRole(routeId: string | null | undefined): number {
	if (routeId === '/(app)/database') return CURATOR_ROLE
	if (routeId === '/(app)/database/events' || routeId?.startsWith('/(app)/database/events/')) {
		return CURATOR_ROLE
	}
	return EDITOR_ROLE
}

/**
 * Whether this role can add, change or remove staff picks for an event that
 * ends at `endsAt` (null for general picks). Curators can't touch picks for
 * events that have ended; editors can.
 */
export function canEditStaffPicks(
	role: Role,
	endsAt: string | null | undefined,
	now: number = Date.now()
): boolean {
	if (isEditor(role)) return true
	if (!isCurator(role)) return false
	if (!endsAt) return true
	const end = Date.parse(endsAt)
	return Number.isNaN(end) || end > now
}
