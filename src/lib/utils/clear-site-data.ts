/**
 * Clears client storage and best-effort cookie removal, then asks the server to
 * drop httpOnly auth cookies via the standard logout endpoint.
 */
export async function clearSiteCookiesAndStorage(): Promise<void> {
	await fetch('/auth/logout', {
		method: 'POST',
		credentials: 'include'
	}).catch(() => {})

	try {
		localStorage.clear()
		sessionStorage.clear()
	} catch {
		// Private mode / blocked storage
	}

	const raw = document.cookie
	if (!raw) return

	for (const part of raw.split(';')) {
		const name = part.trim().split('=')[0]
		if (!name) continue
		document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
	}
}
