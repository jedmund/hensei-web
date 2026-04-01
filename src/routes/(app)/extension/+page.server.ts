import type { PageServerLoad } from './$types'

interface GitHubRelease {
	tag_name: string
	published_at: string
}

export const load: PageServerLoad = async ({ setHeaders }) => {
	try {
		const res = await fetch(
			'https://api.github.com/repos/jedmund/hensei-extractor/releases/latest',
			{
				headers: {
					Accept: 'application/vnd.github+json',
					'User-Agent': 'granblue-team'
				}
			}
		)

		if (!res.ok) {
			return { release: null }
		}

		const data = (await res.json()) as GitHubRelease

		setHeaders({
			'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
		})

		return {
			release: {
				version: data.tag_name.replace('build-', ''),
				publishedAt: data.published_at
			}
		}
	} catch {
		return { release: null }
	}
}
