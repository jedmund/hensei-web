import type { ParamMatcher } from '@sveltejs/kit'
import { isResourceName } from '$lib/features/database/schema/names'

/** Resources with a schema definition: the generic `/database/[resource]` routes */
export const match: ParamMatcher = (param) => isResourceName(param)
