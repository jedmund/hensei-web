import { ComponentProps, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import type { JSONContent } from '@tiptap/core'
import { useEditor, EditorContent } from '@tiptap/react'
import { useTranslation } from 'next-i18next'

import Placeholder from '@tiptap/extension-placeholder'
import FilterMention from '~extensions/FilterMention'
import NoNewLine from '~extensions/NoNewLine'
import classNames from 'classnames'

import { mentionSuggestionOptions } from '~utils/mentionSuggestions'

import styles from './index.module.scss'
import StarterKit from '@tiptap/starter-kit'

interface Props extends ComponentProps<'div'> {
  bound?: boolean
  placeholder?: string
  onUpdate?: (content: string[]) => void
}

const MentionEditor = ({ bound, placeholder, onUpdate, ...props }: Props) => {
  const locale = useRouter().locale || 'en'
  const { t } = useTranslation('common')

  // Setup: Editor
  const editor = useEditor({
    content: '',
    editable: true,
    editorProps: {
      attributes: {
        class: classNames({
          [styles.editor]: true,
          [styles.bound]: bound,
        }),
      },
    },
    extensions: [
      StarterKit,
      Placeholder.configure({
        emptyEditorClass: styles.empty,
        placeholder: placeholder,
      }),
      NoNewLine,
      FilterMention.configure({
        renderLabel({ options, node }) {
          return `${node.attrs.id.name[locale] ?? node.attrs.id.granblue_en}`
        },
        suggestion: mentionSuggestionOptions,
        HTMLAttributes: {
          class: classNames({
            [styles.mention]: true,
          }),
        },
      }),
    ],
    onFocus: ({ editor }) => {
      console.log('Editor reporting that is focused')
    },
    onUpdate: ({ editor }) => {
      const mentions = parseMentions(editor.getJSON())
      if (onUpdate) onUpdate(mentions)
    },
  })

  return (
    <div className={styles.wrapper}>
      <EditorContent editor={editor} />
    </div>
  )
}

function parseMentions(data: JSONContent) {
  const mentions: string[] = (data.content || []).flatMap(parseMentions)
  if (data.type === 'mention') {
    const granblueId = data.attrs?.id.granblue_id
    mentions.push(granblueId)
  }

  return [...new Set(mentions)]
}

MentionEditor.defaultProps = {
  bound: false,
}

export default MentionEditor
