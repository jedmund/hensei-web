export function formatTemplate(params: Record<string, unknown>): string {
	return JSON.stringify(params, null, 2)
}

export function needsTemplateConfirmation(text: string, generatedText: string | null): boolean {
	return generatedText === null || text !== generatedText
}

export function parseRuleParams(text: string): {
	params: Record<string, unknown> | null
	error: string | null
} {
	try {
		const params: unknown = JSON.parse(text)
		if (typeof params !== 'object' || params === null || Array.isArray(params)) {
			return { params: null, error: 'Params must be a JSON object.' }
		}
		return { params: params as Record<string, unknown>, error: null }
	} catch (err) {
		return { params: null, error: err instanceof Error ? err.message : 'Invalid JSON.' }
	}
}
