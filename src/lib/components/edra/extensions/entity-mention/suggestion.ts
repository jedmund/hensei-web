/**
 * Entity Mention Suggestion Configuration
 *
 * Configures the Tiptap suggestion plugin for entity mentions. Suggestions come
 * from a list of providers — an async global entity search plus a sync, party-scoped
 * skill provider that reads the global party store — so adding a new mention source
 * is one more provider, not another branch here.
 */
import type { SuggestionOptions, SuggestionProps, SuggestionKeyDownProps } from '@tiptap/suggestion'
import { searchAdapter } from '$lib/api/adapters/search.adapter'
import { mount, unmount } from 'svelte'
import EntityMentionList from './EntityMentionList.svelte'
import { entityResultToSuggestion, partySkillMentionsProvider } from './mentions/index.js'
import type { MentionSuggestion, MentionToken } from './mentions/index.js'

/** Require at least this many characters before any provider runs. */
const MIN_QUERY_LENGTH = 2
/** Cap on the merged result set across all providers. */
const TOTAL_RESULT_CAP = 8

/** A suggestion source. Sync providers resolve immediately; async ones are awaited together. */
type SuggestionProvider =
	| { mode: 'sync'; fn: (query: string) => MentionSuggestion[] }
	| { mode: 'async'; fn: (query: string) => Promise<MentionSuggestion[]> }

/** Global character/weapon/summon search via the unified search endpoint. */
const globalEntityProvider: SuggestionProvider = {
	mode: 'async',
	fn: async (query) => {
		try {
			const response = await searchAdapter.searchAll({ query, per: 5 })
			return response.results.map(entityResultToSuggestion)
		} catch (error) {
			if (import.meta.env.DEV) {
				console.error('Entity mention search failed:', error)
			}
			return []
		}
	}
}

/** Party-scoped character skills, surfaced by skill name or owning character name. */
const skillProvider: SuggestionProvider = {
	mode: 'sync',
	fn: partySkillMentionsProvider
}

const DEFAULT_PROVIDERS: SuggestionProvider[] = [skillProvider, globalEntityProvider]

/** De-duplicates merged suggestions by their stable key, preserving order. */
function dedupe(suggestions: MentionSuggestion[]): MentionSuggestion[] {
	const seen = new Set<string>()
	const result: MentionSuggestion[] = []
	for (const suggestion of suggestions) {
		if (seen.has(suggestion.key)) continue
		seen.add(suggestion.key)
		result.push(suggestion)
	}
	return result
}

/**
 * Creates the suggestion configuration for entity mentions.
 *
 * Providers default to the global entity search + party skill provider; both are
 * harmless in editors without a loaded party (the skill provider just returns []).
 */
export function createEntityMentionSuggestion(
	providers: SuggestionProvider[] = DEFAULT_PROVIDERS
): Omit<SuggestionOptions<MentionSuggestion>, 'editor'> {
	return {
		char: '@',
		allowSpaces: false,

		items: async ({ query }): Promise<MentionSuggestion[]> => {
			if (query.length < MIN_QUERY_LENGTH) return []

			// Skills (sync) come first so a character's own skills sit above global hits.
			const sync = providers
				.filter((provider) => provider.mode === 'sync')
				.flatMap((provider) => provider.fn(query))
			const async = await Promise.all(
				providers
					.filter((provider) => provider.mode === 'async')
					.map((provider) => provider.fn(query))
			)

			return dedupe([...sync, ...async.flat()]).slice(0, TOTAL_RESULT_CAP)
		},

		render: () => {
			let container: HTMLElement | null = null
			let component: ReturnType<typeof mount> | null = null
			let componentInstance: { onKeyDown: (event: KeyboardEvent) => boolean } | null = null

			const mountList = (props: SuggestionProps<MentionSuggestion>) => {
				if (!container) return
				component = mount(EntityMentionList, {
					target: container,
					props: {
						items: props.items,
						command: (token: MentionToken) => props.command({ id: token }),
						query: props.query
					}
				})
				componentInstance = component as unknown as {
					onKeyDown: (event: KeyboardEvent) => boolean
				}
			}

			return {
				onStart: (props: SuggestionProps<MentionSuggestion>) => {
					container = document.createElement('div')
					container.className = 'entity-mention-popup'
					document.body.appendChild(container)

					mountList(props)
					updatePosition(container, props.clientRect)
				},

				onUpdate: (props: SuggestionProps<MentionSuggestion>) => {
					if (!component || !container) return

					// Svelte 5 mount() props aren't reactive, so remount on each update.
					unmount(component)
					mountList(props)
					updatePosition(container, props.clientRect)
				},

				onKeyDown: (props: SuggestionKeyDownProps): boolean => {
					if (props.event.key === 'Escape') {
						return true
					}
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
