import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'
import classNames from 'classnames'

import * as ElementTransformer from '~transformers/ElementTransformer'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import styles from './index.module.scss'

interface Props {
  currentElement: GranblueElement
  sendValue: (value: GranblueElement) => void
}

const ElementToggle = ({ currentElement, sendValue, ...props }: Props) => {
  // Router and localization
  const router = useRouter()
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  const { t } = useTranslation('common')

  // State: Component
  const [element, setElement] = useState(currentElement)

  // Methods: Handlers
  const handleElementChange = (value: string) => {
    const newElement = ElementTransformer.toObject(parseInt(value))
    setElement(newElement)
    sendValue(newElement)
  }

  // Methods: Rendering
  return (
    <ToggleGroup.Root
      className={styles.group}
      type="single"
      value={`${element}`}
      aria-label="Element"
      onValueChange={handleElementChange}
    >
      <ToggleGroup.Item
        className={classNames({
          [styles.item]: true,
          [styles[`${locale}`]]: true,
        })}
        value="0"
        aria-label="null"
      >
        {t('elements.null')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={classNames({
          [styles.item]: true,
          [styles.wind]: true,
          [styles[`${locale}`]]: true,
        })}
        value="1"
        aria-label="wind"
      >
        {t('elements.wind')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={classNames({
          [styles.item]: true,
          [styles.fire]: true,
          [styles[`${locale}`]]: true,
        })}
        value="2"
        aria-label="fire"
      >
        {t('elements.fire')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={classNames({
          [styles.item]: true,
          [styles.water]: true,
          [styles[`${locale}`]]: true,
        })}
        value="3"
        aria-label="water"
      >
        {t('elements.water')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={classNames({
          [styles.item]: true,
          [styles.earth]: true,
          [styles[`${locale}`]]: true,
        })}
        value="4"
        aria-label="earth"
      >
        {t('elements.earth')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={classNames({
          [styles.item]: true,
          [styles.dark]: true,
          [styles[`${locale}`]]: true,
        })}
        value="5"
        aria-label="dark"
      >
        {t('elements.dark')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={classNames({
          [styles.item]: true,
          [styles.light]: true,
          [styles[`${locale}`]]: true,
        })}
        value="6"
        aria-label="light"
      >
        {t('elements.light')}
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  )
}

export default ElementToggle
