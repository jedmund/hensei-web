<script lang="ts">
	import type { JSONContent } from '@tiptap/core'

	interface Props {
		content?: string
		truncate?: boolean
		maxLines?: number
	}

	let { content, truncate = false, maxLines = 3 }: Props = $props()

	// Convert TipTap JSON to HTML manually
	function jsonToHtml(node: JSONContent): string {
		if (!node) return ''

		// Handle text nodes
		if (node.type === 'text') {
			let text = node.text || ''

			// Apply marks (formatting)
			if (node.marks) {
				node.marks.forEach((mark) => {
					switch (mark.type) {
						case 'bold':
							text = `<strong>${text}</strong>`
							break
						case 'italic':
							text = `<em>${text}</em>`
							break
						case 'strike':
							text = `<s>${text}</s>`
							break
						case 'underline':
							text = `<u>${text}</u>`
							break
						case 'highlight':
							text = `<mark>${text}</mark>`
							break
						case 'link':
							text = `<a href="${mark.attrs?.href}" target="_blank" rel="noopener noreferrer">${text}</a>`
							break
						case 'code':
							text = `<code>${text}</code>`
							break
					}
				})
			}
			return text
		}

		// Handle different node types
		switch (node.type) {
			case 'doc':
				return (node.content || []).map(jsonToHtml).join('')

			case 'paragraph':
				const content = (node.content || []).map(jsonToHtml).join('')
				return `<p>${content || '<br>'}</p>`

			case 'heading':
				const level = node.attrs?.level || 1
				const headingContent = (node.content || []).map(jsonToHtml).join('')
				return `<h${level}>${headingContent}</h${level}>`

			case 'bulletList':
				const listItems = (node.content || []).map(jsonToHtml).join('')
				return `<ul>${listItems}</ul>`

			case 'orderedList':
				const orderedItems = (node.content || []).map(jsonToHtml).join('')
				return `<ol>${orderedItems}</ol>`

			case 'listItem':
				const itemContent = (node.content || []).map(jsonToHtml).join('')
				return `<li>${itemContent}</li>`

			case 'blockquote':
				const quoteContent = (node.content || []).map(jsonToHtml).join('')
				return `<blockquote>${quoteContent}</blockquote>`

			case 'codeBlock':
				const codeContent = (node.content || []).map((n) => n.text || '').join('')
				return `<pre><code>${codeContent}</code></pre>`

			case 'hardBreak':
				return '<br>'

			case 'horizontalRule':
				return '<hr>'

			case 'youtube':
				const videoUrl = node.attrs?.src || ''
				// Extract video ID from various YouTube URL formats
				let videoId = ''

				// Handle different YouTube URL formats
				const patterns = [
					/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
					/youtube\.com\/watch\?.*v=([^&\n?#]+)/
				]

				for (const pattern of patterns) {
					const match = videoUrl.match(pattern)
					if (match) {
						videoId = match[1]
						break
					}
				}

				// If we couldn't extract an ID, fall back to link
				if (!videoId) {
					return `<p><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">📹 View Video</a></p>`
				}

				// For truncated view, show a link instead of embed
				if (truncate) {
					return `<p><a href="${videoUrl}" target="_blank" rel="noopener noreferrer">📹 View Video</a></p>`
				}

				// Embed YouTube video with responsive iframe
				return `<div class="video-wrapper">
					<iframe
						src="https://www.youtube.com/embed/${videoId}"
						title="YouTube video"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
					></iframe>
				</div>`

			case 'mention':
				// Handle game item mentions
				const mentionName = node.attrs?.id?.name?.en || node.attrs?.id?.granblue_en || 'Unknown'
				const wikiUrl = `https://gbf.wiki/${mentionName}`
				return `<a href="${wikiUrl}" target="_blank" rel="noopener noreferrer" class="mention">${mentionName}</a>`

			default:
				// For unknown types, try to render content if it exists
				if (node.content) {
					return (node.content || []).map(jsonToHtml).join('')
				}
				return ''
		}
	}

	// Parse content - handle both JSON and plain text
	function parseContent(content?: string): string {
		if (!content) return ''

		// Try to parse as JSON first
		try {
			const json = JSON.parse(content) as JSONContent
			return jsonToHtml(json)
		} catch {
			// If not JSON, treat as plain text
			// Convert double newlines to paragraphs and single newlines to br tags
			const paragraphs = content.split('\n\n')
			const formatted = paragraphs
				.map((p) => {
					const lines = p.split('\n')
					return `<p>${lines.join('<br />')}</p>`
				})
				.join('')
			return formatted
		}
	}

	const parsedHTML = $derived(parseContent(content))
</script>

<div class="description-content" class:truncate style={truncate ? `--max-lines: ${maxLines}` : ''}>
	{@html parsedHTML}
</div>

<style lang="scss">
	@use '$src/themes/typography' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;

	.description-content {
		color: var(--text-primary);
		font-size: $font-regular;
		line-height: 1.6;

		// Basic HTML styling for generated content
		:global {
			p {
				margin: 0 0 $unit 0;

				&:last-child {
					margin-bottom: 0;
				}
			}

			h1,
			h2,
			h3 {
				font-weight: $bold;
				margin: $unit 0 $unit-half 0;
			}

			h1 {
				font-size: $font-xlarge;
			}

			h2 {
				font-size: $font-large;
			}

			h3 {
				font-size: $font-medium;
			}

			strong,
			b {
				font-weight: $bold;
			}

			em,
			i {
				font-style: italic;
			}

			a {
				color: var(--accent-blue);
				text-decoration: none;

				&:hover {
					text-decoration: underline;
				}
			}

			mark {
				background: rgba(255, 237, 76, 0.3);
				color: var(--text-primary);
				padding: 0 $unit-fourth;
				border-radius: $input-corner;
				font-weight: $medium;
			}

			.mention {
				color: var(--accent-blue);
				font-weight: $medium;
				text-decoration: none;

				&:hover {
					text-decoration: underline;
				}
			}

			ul,
			ol {
				margin: 0 0 $unit 0;
				padding-left: $unit-3x;
			}

			li {
				margin: $unit-half 0;
			}

			code {
				background: var(--button-bg);
				padding: 2px $unit-half;
				border-radius: $input-corner;
				font-family: monospace;
				font-size: 0.9em;
			}

			pre {
				background: var(--button-bg);
				padding: $unit;
				border-radius: $card-corner;
				overflow-x: auto;
				margin: $unit 0;

				code {
					background: none;
					padding: 0;
				}
			}

			blockquote {
				border-left: 3px solid var(--accent-blue);
				padding-left: $unit-2x;
				margin: $unit 0;
				font-style: italic;
				color: var(--text-secondary);
			}

			hr {
				border: none;
				border-top: 1px solid var(--button-bg);
				margin: $unit-2x 0;
			}

			// Responsive YouTube video embed
			.video-wrapper {
				position: relative;
				padding-bottom: 56.25%; // 16:9 aspect ratio
				height: 0;
				overflow: hidden;
				margin: $unit 0;
				border-radius: $card-corner;
				background: var(--button-bg);

				iframe {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
					border: 0;
					border-radius: $card-corner;
				}
			}
		}

		&.truncate {
			display: -webkit-box;
			-webkit-line-clamp: var(--max-lines, 3);
			-webkit-box-orient: vertical;
			overflow: hidden;
			text-overflow: ellipsis;

			// Hide block elements that might break truncation
			:global {
				pre,
				blockquote,
				ul,
				ol {
					display: inline;
				}
			}
		}
	}
</style>
