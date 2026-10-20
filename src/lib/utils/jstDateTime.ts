/**
 * Converts between ISO timestamps and JST wall-clock values for
 * `<input type="datetime-local">`. Granblue's schedule is in JST, and JST has
 * no daylight saving, so a fixed +09:00 offset is exact.
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

/** ISO timestamp → `YYYY-MM-DDTHH:mm` in JST ('' if missing or invalid) */
export function isoToJstInput(iso: string | null | undefined): string {
	if (!iso) return ''
	const time = Date.parse(iso)
	if (Number.isNaN(time)) return ''
	return new Date(time + JST_OFFSET_MS).toISOString().slice(0, 16)
}

/** `YYYY-MM-DDTHH:mm` in JST → ISO timestamp (UTC), or null if invalid */
export function jstInputToIso(value: string | null | undefined): string | null {
	if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null
	const time = Date.parse(`${value}:00+09:00`)
	if (Number.isNaN(time)) return null
	return new Date(time).toISOString()
}

/** Formats a timestamp as a JST date and time, e.g. "2026/10/07 17:00" */
export function formatJstDateTime(iso: string | null | undefined): string {
	const value = isoToJstInput(iso)
	if (!value) return '—'
	return value.replace(/-/g, '/').replace('T', ' ')
}
