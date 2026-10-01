/**
 * Adds the session token and, when API_INTERNAL_SECRET is configured, the
 * visitor's IP to server-side API calls so the API's rate limits count them
 * against the visitor rather than this server.
 */
export function withApiHeaders(
	request: Request,
	{
		token,
		internalSecret,
		visitorIp
	}: { token?: string | undefined; internalSecret?: string | undefined; visitorIp: string | null }
): Request {
	if (!token && !internalSecret) return request

	const headers = new Headers(request.headers)
	if (token) headers.set('authorization', `Bearer ${token}`)
	if (internalSecret) {
		headers.set('x-internal-secret', internalSecret)
		if (visitorIp) headers.set('x-client-ip', visitorIp)
		else headers.delete('x-client-ip')
	}
	return new Request(request, { headers })
}
