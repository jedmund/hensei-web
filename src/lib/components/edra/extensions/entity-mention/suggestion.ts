/**
 * Entity Mention Suggestion Configuration
 *
 * Configures the Tiptap suggestion plugin for entity mentions.
 * Handles search API calls and renders the dropdown using Svelte.
 */
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import { searchAdapter } from '$lib/api/adapters/search.adapter'
import type { UnifiedSearchResult } from '$lib/api/adapters/search.adapter'
import { mount, unmount } from 'svelte'
import EntityMentionList from './EntityMentionList.svelte'
import type { EntityMentionData } from './EntityMentionList.svelte'

interface MentionItem extends UnifiedSearchResult {}

/**
 * Creates the suggestion configuration for entity mentions
 */
export function createEntityMentionSuggestion(): Omit<SuggestionOptions<MentionItem>, 'editor'> {
	return {
		char: '@',
		allowSpaces: false,

		items: async ({ query }): Promise<MentionItem[]> => {
			// Require at least 2 characters to search
			if (query.length < 2) return []

			try {
				const response = await searchAdapter.searchAll({
					query,
					per: 7
				})
				return response.results
			} catch (error) {
				console.error('Entity mention search failed:', error)
				return []
			}
		},

		render: () => {
			let container: HTMLElement | null = null
			let component: ReturnType<typeof mount> | null = null
			let componentInstance: { onKeyDown: (event: KeyboardEvent) => boolean } | null = null

			return {
				onStart: (props: SuggestionProps<MentionItem>) => {
					// Create container element
					container = document.createElement('div')
					container.className = 'entity-mention-popup'
					document.body.appendChild(container)

					// Mount Svelte component
					component = mount(EntityMentionList, {
						target: container,
						props: {
							items: props.items,
							command: (item: EntityMentionData) => {
								props.command({ id: item })
							},
							query: props.query
						}
					})

					// Store reference for keyboard handling
					// The component exports onKeyDown
					componentInstance = component as unknown as { onKeyDown: (event: KeyboardEvent) => boolean }

					// Position the popup
					updatePosition(container, props.clientRect)
				},

				onUpdate: (props: SuggestionProps<MentionItem>) => {
					if (!component || !container) return

					// Update component props - Svelte 5 style
					// We need to remount with new props since mount() doesn't return reactive props
					unmount(component)
					component = mount(EntityMentionList, {
						target: container,
						props: {
							items: props.items,
							command: (item: EntityMentionData) => {
								props.command({ id: item })
							},
							query: props.query
						}
					})
					componentInstance = component as unknown as { onKeyDown: (event: KeyboardEvent) => boolean }

					// Update position
					updatePosition(container, props.clientRect)
				},

				onKeyDown: (props: SuggestionKeyDownProps): boolean => {
					if (props.event.key === 'Escape') {
						return true
					}

					// Delegate to component for arrow/enter handling
					if (componentInstance?.onKeyDown) {
						return componentInstance.onKeyDown(props.event)
					}

					return false
				},

				onExit: () => {
					if (component) {
						unmount(component)
						component = null
					}
					if (container) {
						container.remove()
						container = null
					}
					componentInstance = null
				}
			}
		}
	}
}

/**
 * Positions the popup near the cursor
 */
function updatePosition(
	container: HTMLElement,
	clientRect: (() => DOMRect | null) | null | undefined
) {
	if (!clientRect) return

	const rect = clientRect()
	if (!rect) return

	// Position below the cursor
	const top = rect.bottom + 8
	const left = rect.left

	// Check if popup would go off-screen
	const viewportHeight = window.innerHeight
	const popupHeight = 280 // max-height from styles

	// If not enough space below, position above
	const actualTop = top + popupHeight > viewportHeight ? rect.top - popupHeight - 8 : top

	container.style.position = 'fixed'
	container.style.top = `${actualTop}px`
	container.style.left = `${left}px`
	container.style.zIndex = '1000'
}
