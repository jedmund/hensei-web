'use client'
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react'
import { useTranslations } from 'next-intl'
import { getCookie } from 'cookies-next'
import { SuggestionProps } from '@tiptap/suggestion'
import classNames from 'classnames'

import styles from './index.module.scss'

type Props = Pick<SuggestionProps, 'items' | 'command' | 'query'>

export type MentionRef = {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

export type MentionSuggestion = {
  granblue_id: string
  name: {
    [key: string]: string
    en: string
    ja: string
  }
  type: string
  element: number
}

interface MentionProps extends SuggestionProps {
  items: MentionSuggestion[]
}

export const MentionList = forwardRef<MentionRef, Props>(
  ({ items, ...props }: Props, forwardedRef) => {
    const locale = (getCookie('NEXT_LOCALE') as string) || 'en'

    const t = useTranslations('common')

    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
      const item = items[index]

      if (item) {
        props.command({ id: item })
      }
    }

    const upHandler = () => {
      setSelectedIndex((selectedIndex + items.length - 1) % items.length)
    }

    const downHandler = () => {
      setSelectedIndex((selectedIndex + 1) % items.length)
    }

    const enterHandler = () => {
      selectItem(selectedIndex)
    }

    useEffect(() => setSelectedIndex(0), [items])

    useImperativeHandle(forwardedRef, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          upHandler()
          return true
        }

        if (event.key === 'ArrowDown') {
          downHandler()
          return true
        }

        if (event.key === 'Enter') {
          enterHandler()
          return true
        }

        return false
      },
    }))

    return (
      <div className={styles.items}>
        {items.length ? (
          items.map((item, index) => (
            <button
              className={classNames({
                [styles.item]: true,
                [styles.selected]: index === selectedIndex,
              })}
              key={index}
              onClick={() => selectItem(index)}
            >
              <div className={styles[item.type]}>
                <img
                  alt={item.name[locale]}
                  src={
                    item.type === 'character'
                      ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/${item.type}-square/${item.granblue_id}_01.jpg`
                      : item.type === 'job'
                      ? `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/job-icons/${item.granblue_id}.png`
                      : `${process.env.NEXT_PUBLIC_SIERO_IMG_URL}/${item.type}-square/${item.granblue_id}.jpg`
                  }
                />
              </div>
              <span>{item.name[locale]}</span>
            </button>
          ))
        ) : (
          <div className={styles.noResult}>
            {props.query.length < 3
              ? t('search.errors.type')
              : t('search.errors.no_results_generic')}
          </div>
        )}
      </div>
    )
  }
)

MentionList.displayName = 'MentionList'
