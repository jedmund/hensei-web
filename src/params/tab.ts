import type { ParamMatcher } from '@sveltejs/kit'

export const match: ParamMatcher = (param) => {
	return ['weapons', 'summons', 'characters'].includes(param)
}
