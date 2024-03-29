import { ComponentProps, useCallback, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Youtube from '@tiptap/extension-youtube'
import CustomMention from '~extensions/CustomMention'
import classNames from 'classnames'

import { mentionSuggestionOptions } from '~utils/mentionSuggestions'
import type { JSONContent } from '@tiptap/core'
import ToolbarButton from '~components/common/ToolbarButton'

import BoldIcon from 'remixicon-react/BoldIcon'
import ItalicIcon from 'remixicon-react/ItalicIcon'
import StrikethroughIcon from 'remixicon-react/StrikethroughIcon'
import UnorderedListIcon from 'remixicon-react/ListUnorderedIcon'
import OrderedListIcon from '~public/icons/remix/list-ordered-2.svg'
import PaintbrushIcon from 'remixicon-react/PaintBrushLineIcon'
import H1Icon from 'remixicon-react/H1Icon'
import H2Icon from 'remixicon-react/H2Icon'
import H3Icon from 'remixicon-react/H3Icon'
import LinkIcon from 'remixicon-react/LinkIcon'
import YoutubeIcon from 'remixicon-react/YoutubeLineIcon'
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
  // Hooks: Router
  const router = useRouter()
  const locale = router.locale || 'en'

  const { t } = useTranslation('common')

  useEffect(() => {
    editor?.commands.setContent(formatContent(content))
  }, [content])

  // Setup: Editor
  const editor = useEditor({
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
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link,
      Highlight,
      Placeholder.configure({
        emptyEditorClass: styles.empty,
        placeholder: t('modals.edit_team.placeholders.description'),
      }),
      Typography,
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

  // Methods: Convenience
  function isJSON(content?: string) {
    if (!content) return false

    try {
      JSON.parse(content)
    } catch (e) {
      return false
    }
    return true
  }

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

  // Methods: Actions
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

  // Methods: Rendering
  if (!editor) {
    return null
  }

  return (
    <section className={styles.wrapper}>
      {editor && editable === true && (
        <nav className={styles.toolbar}>
          <ToolbarButton
            editor={editor}
            action="bold"
            icon={<BoldIcon />}
            onClick={() => editor.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            editor={editor}
            action="italic"
            icon={<ItalicIcon />}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            editor={editor}
            action="strike"
            icon={<StrikethroughIcon />}
            onClick={() => editor.chain().focus().toggleStrike().run()}
          />
          <ToolbarButton
            editor={editor}
            action="highlight"
            icon={<PaintbrushIcon />}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
          />
          <div className={styles.divider} />
          <ToolbarButton
            editor={editor}
            action="heading"
            level={1}
            icon={<H1Icon />}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          />
          <ToolbarButton
            editor={editor}
            action="heading"
            level={2}
            icon={<H2Icon />}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          />
          <ToolbarButton
            editor={editor}
            action="heading"
            level={3}
            icon={<H3Icon />}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
          />
          <div className={styles.divider} />
          <ToolbarButton
            editor={editor}
            action="bulletList"
            icon={<UnorderedListIcon />}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            editor={editor}
            action="orderedList"
            icon={<OrderedListIcon />}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          />
          <div className={styles.divider} />
          <ToolbarButton
            editor={editor}
            action="link"
            icon={<LinkIcon />}
            onClick={setLink}
          />
          <ToolbarButton
            editor={editor}
            action="youtube"
            icon={<YoutubeIcon />}
            onClick={addYoutubeVideo}
          />
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
