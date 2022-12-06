import React from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import * as ToggleGroup from '@radix-ui/react-toggle-group'

import './index.scss'

interface Props {
  currentElement: number
  sendValue: (value: string) => void
}

const ElementToggle = (props: Props) => {
  const router = useRouter()
  const { t } = useTranslation('common')
  const locale =
    router.locale && ['en', 'ja'].includes(router.locale) ? router.locale : 'en'

  return (
    <ToggleGroup.Root
      className="ToggleGroup"
      type="single"
      defaultValue={`${props.currentElement}`}
      aria-label="Element"
      onValueChange={props.sendValue}
    >
      <ToggleGroup.Item
        className={`ToggleItem ${locale}`}
        value="0"
        aria-label="null"
      >
        {t('elements.null')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={`ToggleItem wind ${locale}`}
        value="1"
        aria-label="wind"
      >
        {t('elements.wind')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={`ToggleItem fire ${locale}`}
        value="2"
        aria-label="fire"
      >
        {t('elements.fire')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={`ToggleItem water ${locale}`}
        value="3"
        aria-label="water"
      >
        {t('elements.water')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={`ToggleItem earth ${locale}`}
        value="4"
        aria-label="earth"
      >
        {t('elements.earth')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={`ToggleItem dark ${locale}`}
        value="5"
        aria-label="dark"
      >
        {t('elements.dark')}
      </ToggleGroup.Item>
      <ToggleGroup.Item
        className={`ToggleItem light ${locale}`}
        value="6"
        aria-label="light"
      >
        {t('elements.light')}
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  )
}

export default ElementToggle
