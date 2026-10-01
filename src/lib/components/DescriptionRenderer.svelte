<script lang="ts">
	import { computePosition, flip, shift, offset } from '@floating-ui/dom'
	import MentionTooltip from '$lib/components/ui/MentionTooltip.svelte'
	import type { MentionToken } from './edra/extensions/entity-mention/mentions/index.js'
	import { parseDescription } from '$lib/utils/descriptionHtml'

	interface Props {
		content?: string
		truncate?: boolean
		maxLines?: number
	}

	let { content, truncate = false, maxLines = 3 }: Props = $props()

	// Tooltip state
	let tooltipEntity: MentionToken | null = $state(null)
	let tooltipVisible = $state(false)
	let tooltipEl: HTMLDivElement | null = $state(null)
	let containerEl: HTMLDivElement | null = $state(null)

	const parsed = $derived(parseDescription(content, truncate))
	const parsedHTML = $derived(parsed.html)
	const mentionEntities = $derived(parsed.entities)

	// Suppress tooltips while selecting text
	let isSelecting = $state(false)

	function handleMouseDown() {
		isSelecting = true
		tooltipVisible = false
		tooltipEntity = null
	}

	function handleMouseUp() {
		// Small delay so tooltip doesn't flash immediately after selection ends
		setTimeout(() => {
			isSelecting = false
		}, 100)
	}

	// Tooltip hover handlers
	function handleMentionEnter(event: MouseEvent) {
		if (isSelecting) return
		const target = (event.target as HTMLElement).closest?.('.mention[data-mention-index]')
		if (!target) return

		const index = Number((target as HTMLElement).dataset.mentionIndex)
		const entity = mentionEntities.get(index)
		if (!entity) return

		tooltipEntity = entity
		tooltipVisible = true

		// Position tooltip using Floating UI
		requestAnimationFrame(() => {
			if (!tooltipEl) return
			computePosition(target as HTMLElement, tooltipEl, {
				placement: 'top',
				middleware: [offset(8), flip(), shift({ padding: 8 })]
			}).then(({ x, y }) => {
				if (tooltipEl) {
					tooltipEl.style.left = `${x}px`
					tooltipEl.style.top = `${y}px`
				}
			})
		})
	}

	function handleMentionLeave(event: MouseEvent) {
		const related = event.relatedTarget as HTMLElement | null
		if (related?.closest?.('.mention-tooltip-wrapper')) return
		tooltipVisible = false
		tooltipEntity = null
	}

	function handleTooltipLeave(event: MouseEvent) {
		const related = event.relatedTarget as HTMLElement | null
		if (related?.closest?.('.mention[data-mention-index]')) return
		tooltipVisible = false
		tooltipEntity = null
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="description-content"
	class:truncate
	style={truncate ? `--max-lines: ${maxLines}` : ''}
	bind:this={containerEl}
	onmousedown={handleMouseDown}
	onmouseup={handleMouseUp}
	onmouseenter={handleMentionEnter}
	onmouseover={handleMentionEnter}
	onmouseleave={handleMentionLeave}
>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html parsedHTML}
</div>

{#if tooltipEntity}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="mention-tooltip-wrapper" bind:this={tooltipEl} onmouseleave={handleTooltipLeave}>
		<MentionTooltip entity={tooltipEntity} visible={tooltipVisible} />
	</div>
{/if}

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
				overflow-wrap: break-word;
				word-break: break-word;

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
				padding: 2px $unit-half;
				border-radius: $input-corner;
				text-decoration: none;
				font-weight: $medium;
				background: var(--null-mention-bg);
				color: var(--text-primary);
				transition:
					background 0.15s,
					opacity 0.15s;

				&:hover {
					opacity: 0.8;
					text-decoration: none;
				}

				&[data-element='wind'] {
					background: var(--wind-mention-bg);
					color: var(--wind-text);
				}

				&[data-element='fire'] {
					background: var(--fire-mention-bg);
					color: var(--fire-text);
				}

				&[data-element='water'] {
					background: var(--water-mention-bg);
					color: var(--water-text);
				}

				&[data-element='earth'] {
					background: var(--earth-mention-bg);
					color: var(--earth-text);
				}

				&[data-element='dark'] {
					background: var(--dark-mention-bg);
					color: var(--dark-text);
				}

				&[data-element='light'] {
					background: var(--light-mention-bg);
					color: var(--light-text);
				}

				// Skill mentions tint by skill type color rather than element.
				&[data-skill-color='damage'] {
					background: color-mix(in srgb, #d64545 18%, transparent);
					color: #d64545;
				}

				&[data-skill-color='heal'] {
					background: color-mix(in srgb, #3fa34d 18%, transparent);
					color: #3fa34d;
				}

				&[data-skill-color='buff'] {
					background: color-mix(in srgb, #e0a93b 18%, transparent);
					color: #b9831f;
				}

				&[data-skill-color='debuff'] {
					background: color-mix(in srgb, #4a6fd6 18%, transparent);
					color: #4a6fd6;
				}

				&[data-skill-color='field'] {
					background: color-mix(in srgb, #8b5cf6 18%, transparent);
					color: #8b5cf6;
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
			line-clamp: var(--max-lines, 3);
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

	.mention-tooltip-wrapper {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 9999;
		pointer-events: auto;
	}
</style>
