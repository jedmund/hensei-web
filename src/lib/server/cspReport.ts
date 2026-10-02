/**
 * Parsing and log formatting for Content-Security-Policy violation reports.
 * Browsers send either the legacy report-uri format
 * (`{"csp-report": {...}}`, kebab-case keys) or the Reporting API format
 * (`[{"type": "csp-violation", "body": {...}}]`, camelCase keys).
 */

export interface CspViolation {
	directive: string
	blocked: string
	page: string
	source: string
}

const EXTENSION_SCHEMES = ['chrome-extension:', 'moz-extension:', 'safari-web-extension:']

function str(value: unknown): string {
	return typeof value === 'string' ? value : ''
}

function fromFields(fields: Record<string, unknown>, camel: boolean): CspViolation {
	const key = (kebab: string, camelCase: string) => fields[camel ? camelCase : kebab]
	return {
		directive:
			str(key('effective-directive', 'effectiveDirective')) ||
			str(key('violated-directive', 'violatedDirective')),
		blocked: str(key('blocked-uri', 'blockedURL')),
		page: str(key('document-uri', 'documentURL')),
		source: str(key('source-file', 'sourceFile'))
	}
}

/** Extracts violations from either report format; ignores anything else. */
export function parseCspReports(body: unknown): CspViolation[] {
	if (Array.isArray(body)) {
		return body
			.filter(
				(r): r is { type: string; body: Record<string, unknown> } =>
					!!r &&
					typeof r === 'object' &&
					r.type === 'csp-violation' &&
					!!r.body &&
					typeof r.body === 'object'
			)
			.map((r) => fromFields(r.body, true))
	}
	if (body && typeof body === 'object' && 'csp-report' in body) {
		const report = (body as Record<string, unknown>)['csp-report']
		if (report && typeof report === 'object')
			return [fromFields(report as Record<string, unknown>, false)]
	}
	return []
}

/** The origin of a URL, a keyword such as "inline" or "eval", or the scheme. */
function describeSource(raw: string): string {
	if (!raw) return '-'
	if (!raw.includes(':')) return raw // keywords: inline, eval, wasm-eval, …
	try {
		const url = new URL(raw)
		return url.protocol === 'http:' || url.protocol === 'https:' ? url.origin : url.protocol
	} catch {
		return raw.split(':')[0] + ':'
	}
}

/** The page's path only: query strings and fragments can carry tokens. */
function pagePath(raw: string): string {
	try {
		return new URL(raw).pathname
	} catch {
		return '-'
	}
}

function isExtension(raw: string): boolean {
	return EXTENSION_SCHEMES.some((scheme) => raw.startsWith(scheme))
}

/**
 * One log line for a violation, or a short marker for ones caused by browser
 * extensions (counted, but not worth acting on).
 */
export function summarizeViolation(v: CspViolation): string | null {
	if (!v.directive && !v.blocked) return null
	if (isExtension(v.blocked) || isExtension(v.source)) {
		return `[csp] extension directive=${v.directive || '-'}`
	}
	return `[csp] directive=${v.directive || '-'} blocked=${describeSource(v.blocked)} page=${pagePath(v.page)} source=${describeSource(v.source)}`
}
