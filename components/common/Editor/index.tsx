import { ComponentProps, useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useEditor, Editor as TiptapEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Youtube from '@tiptap/extension-youtube'
import CustomMention from '~extensions/CustomMention'
import classNames from 'classnames'

import { mentionSuggestionOptions } from '~utils/mentionSuggestions'
import type { JSONContent } from '@tiptap/core'

import styles from './index.module.scss'

interface Props extends ComponentProps<'div'> {
  bound: boolean
  editable?: boolean
  content?: string
  onUpdate?: (content: JSONContent) => void
}

const Editor = ({
  bound,
  className,
  content,
  editable,
  onUpdate,
  ...props
}: Props) => {
  const router = useRouter()
  const locale = router.locale || 'en'

  const [editor, setEditor] = useState<TiptapEditor | undefined>(undefined)

  function isJSON(content?: string) {
    if (!content) return false

    try {
      JSON.parse(content)
    } catch (e) {
      return false
    }
    return true
  }

  useEffect(() => {
    editor?.destroy()
    const newEditor: TiptapEditor = new TiptapEditor({
      content: formatContent(content),
      editable: editable,
      editorProps: {
        attributes: {
          class: classNames(
            {
              [styles.editor]: true,
              [styles.bound]: bound,
            },
            className?.split(' ').map((c) => styles[c])
          ),
        },
      },
      extensions: [
        StarterKit,
        Link,
        CustomMention.configure({
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
        Youtube.configure({
          inline: false,
          modestBranding: true,
          interfaceLanguage: locale,
        }),
      ],
      onUpdate: ({ editor }) => {
        const json = editor.getJSON()
        if (onUpdate) onUpdate(json)
      },
    })

    setEditor(newEditor)
  }, [content])

  function formatContent(content?: string) {
    if (!content) return ''
    if (isJSON(content)) return JSON.parse(content)
    else {
      // Otherwise, create a new <p> tag after each double newline.
      // Add < br /> tags for single newlines.
      // Add a < br /> after each paragraph.
      const paragraphs = content.split('\n\n')
      const formatted = paragraphs
        .map((p) => {
          const lines = p.split('\n')
          return lines.join('<br />')
        })
        .join('</p><br /><p>')
      return formatted
    }
  }

  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run()

      return
    }

    // update link
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL')

    if (editor && url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 320,
        height: 180,
      })
    }
  }

  if (!editor) {
    return null
  }

  return (
    <section className={styles.wrapper}>
      {editor && editable === true && (
        <nav className={styles.toolbar}>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? styles.active : ''}
          >
            bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? styles.active : ''}
          >
            italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? styles.active : ''}
          >
            strike
          </button>
          <div className={styles.divider} />
          <button
            onClick={setLink}
            className={editor.isActive('link') ? styles.active : ''}
          >
            + link
          </button>
          <button onClick={addYoutubeVideo}>+ youtube</button>
        </nav>
      )}
      <EditorContent editor={editor} />
    </section>
  )
}

Editor.defaultProps = {
  bound: false,
  editable: false,
}

export default Editor
