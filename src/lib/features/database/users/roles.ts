/** Account roles as admins see and set them in the Users section */
import * as m from '$lib/paraglide/messages'
import { ADMIN_ROLE, CURATOR_ROLE, EDITOR_ROLE } from '$lib/auth/roles'
import type { EnumOption } from '$lib/features/database/schema/types'

export const USER_ROLE = 1

/** The roles an admin can give from the Database; admins are made in the console */
export const ASSIGNABLE_ROLES = [USER_ROLE, CURATOR_ROLE, EDITOR_ROLE] as const

export const roleOptions = (): EnumOption[] => [
	{ value: USER_ROLE, label: m.db_users_role_user },
	{ value: CURATOR_ROLE, label: m.db_users_role_curator },
	{ value: EDITOR_ROLE, label: m.db_users_role_editor },
	{ value: ADMIN_ROLE, label: m.db_users_role_admin }
]

/** A role's name, or its number for one the app doesn't name */
export function roleLabel(role: number | null | undefined): string {
	const option = roleOptions().find((o) => o.value === role)
	if (!option) return String(role ?? '—')
	return typeof option.label === 'function' ? option.label() : option.label
}
