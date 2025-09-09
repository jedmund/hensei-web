export function head({ title, description }: { title?: string; description?: string }) {
	return `
    <title>${title ?? 'Granblue.team'}</title>
    ${description ? `<meta name="description" content="${description}">` : ''}
    <meta property="og:title" content="${title ?? 'Granblue.team'}">
    ${description ? `<meta property="og:description" content="${description}">` : ''}
    <meta name="twitter:card" content="summary_large_image">
  `
}
