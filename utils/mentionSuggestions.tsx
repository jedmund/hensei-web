import { ReactRenderer } from '@tiptap/react'
import { MentionOptions } from '@tiptap/extension-mention'
import { SuggestionKeyDownProps, SuggestionProps } from '@tiptap/suggestion'
import tippy, { Instance as TippyInstance } from 'tippy.js'
import { getCookie } from 'cookies-next'

import {
  MentionList,
  MentionRef,
  MentionSuggestion,
} from '~components/MentionList'
import api from '~utils/api'
import { numberToElement } from '~utils/elements'
import { SuggestionOptions } from '~extensions/CustomSuggestion'

interface RawSearchResponse {
  searchable_type: string
  granblue_id: string
  name_en: string
  name_jp: string
  element: number
}

interface SearchResponse {
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  type: string
  granblue_id: string
  element: GranblueElement
}

function transform(object: RawSearchResponse) {
  const result: SearchResponse = {
    name: {
      en: object.name_en,
      ja: object.name_jp,
    },
    type: object.searchable_type.toLowerCase(),
    granblue_id: object.granblue_id,
    element: numberToElement(object.element),
  }
  return result
}
//
export const mentionSuggestionOptions: Omit<SuggestionOptions, 'editor'> = {
  items: async ({ query }): Promise<MentionSuggestion[]> => {
    const locale = getCookie('NEXT_LOCALE')
      ? (getCookie('NEXT_LOCALE') as string)
      : 'en'
    const response = await api.searchAll(query, locale)
    const results = response.data.results

    return results
      .map((rawObject: RawSearchResponse, index: number) => {
        const object = transform(rawObject)
        return {
          granblue_id: object.granblue_id,
          element: object.element,
          type: object.type,
          name: {
            en: object.name.en,
            ja: object.name.ja,
          },
        }
      })
      .slice(0, 7)
  },

  render: () => {
    let component: ReactRenderer<MentionRef> | undefined
    let popup: TippyInstance | undefined

    return {
      onStart: (props) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        })[0]
      },

      onUpdate(props) {
        component?.updateProps(props)

        popup?.setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      onKeyDown(props) {
        if (props.event.key === 'Escape') {
          popup?.hide()
          return true
        }

        if (props.event.key === 'Tab') {
          popup?.hide()
        }

        if (!component?.ref) {
          return false
        }

        return component?.ref.onKeyDown(props)
      },

      onExit() {
        popup?.destroy()
        component?.destroy()

        // Remove references to the old popup and component upon destruction/exit.
        // (This should prevent redundant calls to `popup.destroy()`, which Tippy
        // warns in the console is a sign of a memory leak, as the `suggestion`
        // plugin seems to call `onExit` both when a suggestion menu is closed after
        // a user chooses an option, *and* when the editor itself is destroyed.)
        popup = undefined
        component = undefined
      },
    }
  },
}
