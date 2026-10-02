import type { ParamMatcher } from '@sveltejs/kit'
import { isSocialProvider } from '$lib/auth/socialProviders'

export const match: ParamMatcher = (param) => isSocialProvider(param)
